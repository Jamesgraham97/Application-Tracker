/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JobApplication, TimelineEvent, ApplicationStatus } from '../types';
import { MOCK_APPLICATIONS } from './mockData';

const STORAGE_KEY = 'job_tracker_applications';
const SUPABASE_CONFIG_KEY = 'job_tracker_supabase_config';

// Initialize local storage applications if not present
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_APPLICATIONS));
}

// Function to get Supabase Client, if config exists
let cachedSupabaseClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  // 1. Check Vite Environment Variables first (build-time config for GitHub Pages, etc.)
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && envUrl.trim() !== '' && envKey.trim() !== '') {
    return { url: envUrl.trim(), anonKey: envKey.trim(), source: 'env' as const };
  }

  // 2. Fall back to Local Storage (runtime config)
  const configStr = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (configStr) {
    try {
      const parsed = JSON.parse(configStr);
      if (parsed && parsed.url && parsed.anonKey) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim(), source: 'localStorage' as const };
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (!url || !anonKey) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    cachedSupabaseClient = null;
    return;
  }
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
  // Force re-initialization of client
  cachedSupabaseClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedSupabaseClient) return cachedSupabaseClient;

  const config = getSupabaseConfig();
  if (config && config.url && config.anonKey) {
    try {
      cachedSupabaseClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
        }
      });
      return cachedSupabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

export function isConnectedViaEnv(): boolean {
  const config = getSupabaseConfig();
  return config ? config.source === 'env' : false;
}

// Helper to convert database applications to frontend applications
function mapFromDb(dbApp: any): JobApplication {
  return {
    id: dbApp.id,
    company: dbApp.company,
    position: dbApp.position,
    location: dbApp.location || '',
    remote: dbApp.remote || 'Hybrid',
    salaryMin: dbApp.salary_min !== null ? Number(dbApp.salary_min) : undefined,
    salaryMax: dbApp.salary_max !== null ? Number(dbApp.salary_max) : undefined,
    salaryText: dbApp.salary_text || '',
    source: dbApp.source || '',
    jobUrl: dbApp.job_url || '',
    status: dbApp.status || 'Saved',
    notes: dbApp.notes || '',
    appliedDate: dbApp.applied_date || undefined,
    lastUpdated: dbApp.last_updated || dbApp.created_at || new Date().toISOString(),
    createdAt: dbApp.created_at || new Date().toISOString(),
    timeline: typeof dbApp.timeline === 'string' 
      ? JSON.parse(dbApp.timeline) 
      : (dbApp.timeline || [])
  };
}

// Helper to convert frontend applications to database representation
function mapToDb(app: JobApplication): any {
  return {
    id: app.id,
    company: app.company,
    position: app.position,
    location: app.location,
    remote: app.remote,
    salary_min: app.salaryMin,
    salary_max: app.salaryMax,
    salary_text: app.salaryText,
    source: app.source,
    job_url: app.jobUrl,
    status: app.status,
    notes: app.notes,
    applied_date: app.appliedDate || null,
    last_updated: app.lastUpdated,
    created_at: app.createdAt,
    timeline: JSON.stringify(app.timeline || [])
  };
}

// --- DATA ACCESS LAYER ---

export async function getApplications(): Promise<JobApplication[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(mapFromDb);
      }
    } catch (err) {
      console.warn('Supabase error, falling back to local storage:', err);
    }
  }

  // Fallback to localStorage
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData) as JobApplication[];
      return parsed.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    } catch {
      return MOCK_APPLICATIONS;
    }
  }
  return MOCK_APPLICATIONS;
}

export async function getApplication(id: string): Promise<JobApplication | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        return mapFromDb(data);
      }
    } catch (err) {
      console.warn(`Supabase error getting app ${id}, falling back:`, err);
    }
  }

  const apps = await getApplications();
  return apps.find(app => app.id === id) || null;
}

export async function createApplication(app: Omit<JobApplication, 'id' | 'createdAt' | 'lastUpdated' | 'timeline'>): Promise<JobApplication> {
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString().split('T')[0];
  const datetime = new Date().toISOString();

  const initialTimeline: TimelineEvent[] = [
    {
      id: Math.random().toString(36).substring(2, 11),
      applicationId: id,
      status: app.status,
      notes: `Application created with status: ${app.status}`,
      createdAt: datetime
    }
  ];

  const newApp: JobApplication = {
    ...app,
    id,
    createdAt: datetime,
    lastUpdated: datetime,
    timeline: initialTimeline
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const dbRecord = mapToDb(newApp);
      const { error } = await client
        .from('applications')
        .insert([dbRecord]);

      if (error) throw error;
      return newApp;
    } catch (err) {
      console.warn('Supabase error inserting, writing to local storage fallback:', err);
    }
  }

  // Write to LocalStorage
  const apps = await getApplications();
  apps.unshift(newApp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return newApp;
}

export async function updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
  const now = new Date().toISOString();
  
  const client = getSupabaseClient();
  let currentApp = await getApplication(id);
  if (!currentApp) throw new Error(`Application with ID ${id} not found.`);

  // If status changed, create a timeline event automatically
  let updatedTimeline = [...(currentApp.timeline || [])];
  if (updates.status && updates.status !== currentApp.status) {
    const timelineEvent: TimelineEvent = {
      id: Math.random().toString(36).substring(2, 11),
      applicationId: id,
      status: updates.status,
      notes: updates.notes || `Status updated from ${currentApp.status} to ${updates.status}`,
      createdAt: now
    };
    updatedTimeline.push(timelineEvent);
  }

  const updatedApp: JobApplication = {
    ...currentApp,
    ...updates,
    timeline: updatedTimeline,
    lastUpdated: now
  };

  if (client) {
    try {
      const dbRecord = mapToDb(updatedApp);
      const { error } = await client
        .from('applications')
        .update(dbRecord)
        .eq('id', id);

      if (error) throw error;
      return updatedApp;
    } catch (err) {
      console.warn('Supabase error updating, falling back to local:', err);
    }
  }

  // Local Storage fallback
  const apps = await getApplications();
  const index = apps.findIndex(app => app.id === id);
  if (index !== -1) {
    apps[index] = updatedApp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }
  return updatedApp;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase error deleting, falling back to local:', err);
    }
  }

  const apps = await getApplications();
  const filtered = apps.filter(app => app.id !== id);
  if (apps.length !== filtered.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

export async function addTimelineEvent(id: string, status: ApplicationStatus, notes?: string): Promise<JobApplication> {
  const app = await getApplication(id);
  if (!app) throw new Error('Application not found');

  const now = new Date().toISOString();
  const newEvent: TimelineEvent = {
    id: Math.random().toString(36).substring(2, 11),
    applicationId: id,
    status,
    notes,
    createdAt: now
  };

  const updatedTimeline = [...(app.timeline || []), newEvent];
  const updatedApp: JobApplication = {
    ...app,
    status, // Update main status to match timeline
    timeline: updatedTimeline,
    lastUpdated: now
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const dbRecord = mapToDb(updatedApp);
      const { error } = await client
        .from('applications')
        .update(dbRecord)
        .eq('id', id);

      if (error) throw error;
      return updatedApp;
    } catch (err) {
      console.warn('Supabase error adding timeline event, local fallback:', err);
    }
  }

  const apps = await getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index !== -1) {
    apps[index] = updatedApp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }
  return updatedApp;
}

// --- CSV IMPORT / EXPORT UTILITIES ---

export function exportToCSV(applications: JobApplication[]): string {
  const headers = [
    'id', 'company', 'position', 'status', 'location', 'remote', 
    'salaryMin', 'salaryMax', 'salaryText', 'source', 'jobUrl', 
    'appliedDate', 'lastUpdated', 'createdAt', 'notes'
  ];

  const escapeField = (field: any) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = applications.map(app => [
    app.id,
    app.company,
    app.position,
    app.status,
    app.location,
    app.remote,
    app.salaryMin || '',
    app.salaryMax || '',
    app.salaryText || '',
    app.source || '',
    app.jobUrl || '',
    app.appliedDate || '',
    app.lastUpdated,
    app.createdAt,
    app.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\n');

  return csvContent;
}

export async function importFromCSV(csvText: string): Promise<number> {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return 0;

  const headerRow = lines[0].split(',');
  const headers = headerRow.map(h => h.trim().replace(/^"|"$/g, ''));

  let importCount = 0;
  const importedApps: JobApplication[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // A simple CSV cell parser that handles quotes
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, ''));

    // Map row cells to headers
    const rowObj: any = {};
    headers.forEach((h, index) => {
      rowObj[h] = cells[index] || '';
    });

    if (!rowObj.company || !rowObj.position) continue;

    const id = rowObj.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    const now = new Date().toISOString();

    const app: JobApplication = {
      id,
      company: rowObj.company,
      position: rowObj.position,
      status: (rowObj.status as ApplicationStatus) || 'Saved',
      location: rowObj.location || '',
      remote: (rowObj.remote || 'Remote') as any,
      salaryMin: rowObj.salaryMin ? Number(rowObj.salaryMin) : undefined,
      salaryMax: rowObj.salaryMax ? Number(rowObj.salaryMax) : undefined,
      salaryText: rowObj.salaryText || '',
      source: rowObj.source || '',
      jobUrl: rowObj.jobUrl || '',
      notes: rowObj.notes || '',
      appliedDate: rowObj.appliedDate || undefined,
      lastUpdated: rowObj.lastUpdated || now,
      createdAt: rowObj.createdAt || now,
      timeline: [
        {
          id: Math.random().toString(36).substring(2, 11),
          applicationId: id,
          status: (rowObj.status as ApplicationStatus) || 'Saved',
          notes: 'Imported from CSV file',
          createdAt: now
        }
      ]
    };

    importedApps.push(app);
    importCount++;
  }

  if (importedApps.length > 0) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const dbRecords = importedApps.map(mapToDb);
        const { error } = await client
          .from('applications')
          .insert(dbRecords);

        if (error) throw error;
        return importCount;
      } catch (err) {
        console.warn('Supabase import error, importing locally:', err);
      }
    }

    // Save to LocalStorage
    const existingApps = await getApplications();
    const merged = [...importedApps, ...existingApps];
    // Filter duplicates by company + position + appliedDate
    const seen = new Set<string>();
    const unique = merged.filter(app => {
      const key = `${app.company}-${app.position}-${app.appliedDate || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  }

  return importCount;
}

// --- BROWSER EXTENSION INTEGRATION API ---
// This is exposed globally on window or exported so an extension can integrate.
export async function insertApplicationFromExtension(extApp: {
  company: string;
  position: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
  location?: string;
  remote?: 'Onsite' | 'Hybrid' | 'Remote';
  source?: string;
  jobUrl?: string;
  notes?: string;
  status?: ApplicationStatus;
}): Promise<JobApplication> {
  const formattedApp = {
    company: extApp.company,
    position: extApp.position,
    location: extApp.location || '',
    remote: extApp.remote || 'Remote',
    salaryMin: extApp.salaryMin,
    salaryMax: extApp.salaryMax,
    salaryText: extApp.salaryText || '',
    source: extApp.source || 'Browser Extension',
    jobUrl: extApp.jobUrl || '',
    notes: extApp.notes || '',
    status: extApp.status || 'Saved',
    appliedDate: extApp.status === 'Applied' ? new Date().toISOString().split('T')[0] : undefined,
  };

  return createApplication(formattedApp);
}

// Make it available on window for browser extensions to easily access in development
if (typeof window !== 'undefined') {
  (window as any).JobTrackerAPI = {
    insertApplicationFromExtension,
    getApplications,
    createApplication,
    isSupabaseConnected
  };
}
