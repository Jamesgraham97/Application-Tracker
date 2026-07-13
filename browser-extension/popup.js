// Tab Switching Logic
document.getElementById('tab-clip').addEventListener('click', () => {
  document.getElementById('tab-clip').classList.add('active');
  document.getElementById('tab-settings').classList.remove('active');
  document.getElementById('panel-clip').classList.remove('hidden');
  document.getElementById('panel-settings').classList.add('hidden');
  clearStatus();
});

document.getElementById('tab-settings').addEventListener('click', () => {
  document.getElementById('tab-clip').classList.remove('active');
  document.getElementById('tab-settings').classList.add('active');
  document.getElementById('panel-clip').classList.add('hidden');
  document.getElementById('panel-settings').classList.remove('hidden');
  clearStatus();
});

// Load Config & Autofill Job details from Active Tab
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved Supabase credentials
  chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (result) => {
    if (result.supabaseUrl) {
      document.getElementById('sup_url').value = result.supabaseUrl;
    }
    if (result.supabaseKey) {
      document.getElementById('sup_key').value = result.supabaseKey;
    }
  });

  // Get current active tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    document.getElementById('job_url').value = tab.url;
    // Attempt automatic scraping immediately on load
    runScraper(tab);
  }
});

// Manual scrape button click
document.getElementById('btn-scrape').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    runScraper(tab);
  }
});

function runScraper(tab) {
  showStatus('Scraping job info...', 'success');
  
  chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
    // If background script or content script wasn't loaded, inject it
    if (chrome.runtime.lastError || !response) {
      // Execute manual injector fallback
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        if (!chrome.runtime.lastError) {
          // Retry sending message
          chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (retryResponse) => {
            if (retryResponse) {
              populateForm(retryResponse);
              showStatus('Information extracted!', 'success');
            } else {
              showStatus('Could not auto-scrape. Please enter details manually.', 'error');
            }
          });
        } else {
          showStatus('Could not auto-scrape on this tab.', 'error');
        }
      });
    } else {
      populateForm(response);
      showStatus('Information extracted!', 'success');
    }
  });
}

function populateForm(data) {
  if (data.company) document.getElementById('company').value = data.company;
  if (data.position) document.getElementById('position').value = data.position;
  if (data.location) document.getElementById('location').value = data.location;
  if (data.remote) document.getElementById('remote').value = data.remote;
  if (data.jobUrl) document.getElementById('job_url').value = data.jobUrl;
  if (data.salaryMin) document.getElementById('salary_min').value = data.salaryMin;
  if (data.salaryMax) document.getElementById('salary_max').value = data.salaryMax;
  if (data.notes) document.getElementById('notes').value = data.notes;
}

// Save Settings Event
document.getElementById('btn-save-settings').addEventListener('click', () => {
  const url = document.getElementById('sup_url').value.trim();
  const key = document.getElementById('sup_key').value.trim();

  if (!url || !key) {
    showStatus('Please fill in both Supabase URL and Key.', 'error');
    return;
  }

  chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key }, () => {
    showStatus('Supabase settings saved successfully!', 'success');
    // Switch to Clip tab
    setTimeout(() => {
      document.getElementById('tab-clip').click();
    }, 1000);
  });
});

// Save Application Event to Supabase REST API
document.getElementById('btn-save').addEventListener('click', () => {
  chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], async (creds) => {
    const url = creds.supabaseUrl;
    const key = creds.supabaseKey;

    if (!url || !key) {
      showStatus('Configure your Supabase credentials in settings first.', 'error');
      document.getElementById('tab-settings').click();
      return;
    }

    const company = document.getElementById('company').value.trim();
    const position = document.getElementById('position').value.trim();
    
    if (!company || !position) {
      showStatus('Company Name and Position Title are required.', 'error');
      return;
    }

    const location = document.getElementById('location').value.trim();
    const remote = document.getElementById('remote').value;
    const salaryMin = document.getElementById('salary_min').value;
    const salaryMax = document.getElementById('salary_max').value;
    const jobUrl = document.getElementById('job_url').value.trim();
    const status = document.getElementById('status').value;
    const notes = document.getElementById('notes').value.trim();

    const applicationData = {
      company,
      position,
      location: location || null,
      remote,
      salary_min: salaryMin ? parseFloat(salaryMin) : null,
      salary_max: salaryMax ? parseFloat(salaryMax) : null,
      salary_text: (salaryMin || salaryMax) ? `€${salaryMin || '?'}${salaryMax ? ` - €${salaryMax}` : ''}` : null,
      source: getDomain(jobUrl) || 'Web Clipper',
      job_url: jobUrl || null,
      status,
      notes: notes || null,
      applied_date: status !== 'Saved' ? new Date().toISOString().split('T')[0] : null,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      timeline: JSON.stringify([{
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        status: status,
        notes: `Application entered via Web Clipper`,
        createdAt: new Date().toISOString()
      }])
    };

    showStatus('Saving to Supabase...', 'success');

    try {
      const response = await fetch(`${url}/rest/v1/applications`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        showStatus('🎉 Application saved successfully!', 'success');
        // Reset fields
        document.getElementById('company').value = '';
        document.getElementById('position').value = '';
        document.getElementById('salary_min').value = '';
        document.getElementById('salary_max').value = '';
        document.getElementById('notes').value = '';
      } else {
        const errText = await response.text();
        console.error('Supabase save failed:', errText);
        showStatus(`Database error: ${response.statusText}`, 'error');
      }
    } catch (err) {
      console.error('Save request failed:', err);
      showStatus('Failed to connect to Supabase. Check network/URL.', 'error');
    }
  });
});

function getDomain(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function showStatus(text, type) {
  const el = document.getElementById('status-msg');
  el.textContent = text;
  el.className = '';
  el.classList.add(type === 'success' ? 'status-success' : 'status-error');
  el.style.display = 'block';
}

function clearStatus() {
  const el = document.getElementById('status-msg');
  el.style.display = 'none';
}
