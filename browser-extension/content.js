// Content script to scrape job page data

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    const jobInfo = scrapeJobDetails();
    sendResponse(jobInfo);
  }
  return true;
});

function scrapeJobDetails() {
  const url = window.location.href;
  let company = "";
  let position = "";
  let location = "";
  let remote = "Remote";
  let salaryMin = "";
  let salaryMax = "";
  let notes = "";

  if (url.includes("linkedin.com")) {
    // 1. LinkedIn Extraction Heuristics
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .jobs-details-top-card__job-title, h1');
    if (titleEl) {
      position = titleEl.innerText.trim();
    }

    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .jobs-details-top-card__company-url, .jobs-unified-top-card__company-name a');
    if (companyEl) {
      company = companyEl.innerText.trim().replace(/\n.*/s, ''); // Remove ratings or extra text
    }

    const locEl = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .jobs-details-top-card__bullet');
    if (locEl) {
      location = locEl.innerText.trim();
    }

    // Determine Work Setting
    const bodyText = document.body.innerText.toLowerCase();
    if (bodyText.includes("hybrid") || position.toLowerCase().includes("hybrid")) {
      remote = "Hybrid";
    } else if (bodyText.includes("onsite") || bodyText.includes("on-site") || position.toLowerCase().includes("onsite")) {
      remote = "Onsite";
    } else {
      remote = "Remote";
    }

  } else if (url.includes("indeed.com")) {
    // 2. Indeed Extraction Heuristics
    const titleEl = document.querySelector('.jobsearch-JobInfoHeader-title, h1');
    if (titleEl) {
      position = titleEl.innerText.trim().replace("- job post", "");
    }

    const companyEl = document.querySelector('[data-company-name="true"], .jobsearch-InlineCompanyRating, .jobsearch-CompanyInfoContainer');
    if (companyEl) {
      company = companyEl.innerText.trim().replace(/\n.*/s, '');
    }

    const locEl = document.querySelector('.jobsearch-JobInfoHeader-subtitle div:last-child, #jobLocationSection, .jobsearch-JobInfoHeader-subtitle');
    if (locEl) {
      location = locEl.innerText.trim().split("—")[0].trim();
    }

    if (document.body.innerText.toLowerCase().includes("hybrid")) {
      remote = "Hybrid";
    } else if (document.body.innerText.toLowerCase().includes("onsite") || document.body.innerText.toLowerCase().includes("on-site")) {
      remote = "Onsite";
    } else {
      remote = "Remote";
    }
  } else {
    // 3. Generic Careers Page Heuristics
    // Use title tags
    const titleParts = document.title.split(/[-|•–]/);
    if (titleParts.length > 0) {
      position = titleParts[0].trim();
    }
    if (titleParts.length > 1) {
      company = titleParts[1].trim();
    }

    // Check common H1/H2
    const h1 = document.querySelector('h1');
    if (h1 && !position) {
      position = h1.innerText.trim();
    }

    // Try to find common metadata matching "location" or "remote"
    const bodyText = document.body.innerText.toLowerCase();
    if (bodyText.includes("dublin")) {
      location = "Dublin, Ireland";
    }
  }

  // Attempt to parse salary from page if standard tags present
  const salaryMatch = document.body.innerText.match(/(?:€|£|\$)\s?(\d{2,3}),?(\d{3})\s?-\s?(?:€|£|\$)\s?(\d{2,3}),?(\d{3})/i);
  if (salaryMatch) {
    salaryMin = salaryMatch[1] + salaryMatch[2];
    salaryMax = salaryMatch[3] + salaryMatch[4];
  }

  // Fallback cleanup
  if (position.length > 80) position = position.substring(0, 80) + "...";
  if (company.length > 60) company = company.substring(0, 60) + "...";

  return {
    company: company || "Unknown Company",
    position: position || "Unknown Position",
    location: location || "Remote / Unknown",
    remote: remote,
    jobUrl: url,
    salaryMin: salaryMin || "",
    salaryMax: salaryMax || "",
    notes: `Scraped from page on ${new Date().toLocaleDateString()}`
  };
}
