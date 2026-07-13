/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Info, 
  Palette, 
  Check, 
  Code,
  FileText,
  HelpCircle,
  Copy,
  Terminal,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConnected, 
  getApplications, 
  exportToCSV, 
  importFromCSV,
  isConnectedViaEnv
} from '../lib/dbService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label, Select } from '../components/ui/FormElements';
import { Badge } from '../components/ui/Badge';

export default function Settings() {
  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isEnvConnection, setIsEnvConnection] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CSV Import/Export States
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportCount, setExportCount] = useState(0);

  // Theme State
  const [themeName, setThemeName] = useState('obsidian');

  // Copy schemas states
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);

  useEffect(() => {
    // Load config on mount
    const config = getSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url || '');
      setSupabaseKey(config.anonKey || '');
    }
    setIsConnected(isSupabaseConnected());
    setIsEnvConnection(isConnectedViaEnv());

    // Load counts
    async function getCount() {
      const apps = await getApplications();
      setExportCount(apps.length);
    }
    getCount();
  }, []);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    
    // Check if connected
    const connectedNow = isSupabaseConnected();
    setIsConnected(connectedNow);
    setSaveSuccess(true);
    
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleDisconnect = () => {
    saveSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsConnected(false);
  };

  const handleExport = async () => {
    try {
      const apps = await getApplications();
      const csv = exportToCSV(apps);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `job_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportCount(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setImportError('Failed to read the file.');
        setIsImporting(false);
        return;
      }

      try {
        const count = await importFromCSV(text);
        setImportCount(count);
        // Refresh page counts
        const apps = await getApplications();
        setExportCount(apps.length);
      } catch (err: any) {
        setImportError(err.message || 'An error occurred during CSV parsing.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('File reader error.');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const sqlSchema = `CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    remote VARCHAR(50) DEFAULT 'Remote',
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_text VARCHAR(255),
    source VARCHAR(255),
    job_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Saved',
    notes TEXT,
    applied_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    timeline JSONB DEFAULT '[]'::jsonb
);`;

  const jsSnippet = `// Browser Extension API snippet
window.JobTrackerAPI.insertApplicationFromExtension({
  company: "Stripe",
  position: "Full Stack Developer",
  salaryMin: 140000,
  salaryMax: 180000,
  location: "San Francisco, CA",
  remote: "Hybrid",
  jobUrl: window.location.href,
  source: "Stripe Careers Board",
  status: "Saved"
});`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="border-b border-[#27272a] pb-5">
        <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">System Settings</h2>
        <p className="text-sm text-zinc-500 mt-1">Configure your cloud database synchronization, import/export archives, and styles.</p>
      </div>

      {/* 1. SUPABASE DATABASE CONNECTION */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Database className="h-4.5 w-4.5 text-zinc-400" />
            <CardTitle className="text-base font-semibold">Supabase Synchronization</CardTitle>
          </div>
          <CardDescription>
            Connect directly to your own Supabase database to synchronize and store your applications durably. Left empty, the app operates securely in offline-ready local storage mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-6">
          {isEnvConnection && (
            <div className="p-3.5 rounded-lg border border-blue-900/40 bg-blue-950/10 text-xs text-blue-400 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Pre-configured via Environment Variables</span>
                <span>This build is preloaded with your Supabase credentials using environment variables. To edit or update these, edit your local <code className="font-mono bg-zinc-950 px-1 py-0.5 rounded text-zinc-300">.env</code> file or configure build-time secrets on your static hosting provider (like GitHub Actions for GitHub Pages).</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSupabase} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supabase-url">Supabase Project URL</Label>
                <Input
                  id="supabase-url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  disabled={isEnvConnection}
                  className={isEnvConnection ? "opacity-60 bg-[#18181b]" : ""}
                />
              </div>
              <div>
                <Label htmlFor="supabase-key">Supabase Anon API Key</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder={isEnvConnection ? "••••••••••••••••••••" : "your-anon-api-key-here"}
                  value={isEnvConnection ? "env-keys-are-hidden-in-ui" : supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  disabled={isEnvConnection}
                  className={isEnvConnection ? "opacity-60 bg-[#18181b]" : ""}
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-[#27272a] mt-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-300">
                  Status: {isConnected ? (isEnvConnection ? 'Synchronized (Connected via .env)' : 'Synchronized (Connected)') : 'Offline (Local Storage Fallback)'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {!isEnvConnection && isConnected && (
                  <Button 
                    type="button"
                    variant="danger" 
                    size="sm" 
                    onClick={handleDisconnect}
                    className="font-medium"
                  >
                    Disconnect
                  </Button>
                )}
                {!isEnvConnection && (
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    className="font-semibold"
                  >
                    {saveSuccess ? 'Saved & Connected!' : 'Connect Database'}
                  </Button>
                )}
                {isEnvConnection && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-1 px-2.5 text-[11px] font-semibold">
                    Env-Managed Connection
                  </Badge>
                )}
              </div>
            </div>
          </form>

          {/* Collapsible SQL Schema Guide */}
          <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                Required SQL Schema Migration for Supabase
              </div>
              <button 
                onClick={() => copyToClipboard(sqlSchema, setCopiedSql)}
                className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-semibold uppercase cursor-pointer bg-zinc-900/60 hover:bg-zinc-900 px-2.5 py-1 rounded-md border border-[#27272a]"
              >
                {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedSql ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-[10px] text-zinc-500 font-mono bg-black/40 p-3 rounded-md overflow-x-auto border border-[#27272a] max-h-[150px] leading-relaxed">
              {sqlSchema}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 2. IMPORT / EXPORT DATA ARCHIVE */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Download className="h-4.5 w-4.5 text-zinc-400" />
            <CardTitle className="text-base font-semibold">Data Portability (CSV)</CardTitle>
          </div>
          <CardDescription>
            Import applications from spreadsheets or export your pipeline safely for sheets modeling.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col md:flex-row gap-6">
          {/* Export Action */}
          <div className="flex-1 p-5 rounded-lg border border-[#27272a] bg-[#18181b]/50 flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">Export Applications</span>
              <span className="text-sm text-zinc-500 block mt-1">Download your full dataset containing all status histories and metadata as a standard CSV format.</span>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-mono text-zinc-600 font-semibold">{exportCount} application records ready</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleExport}
                className="gap-1.5 font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Import Action */}
          <div className="flex-1 p-5 rounded-lg border border-[#27272a] bg-[#18181b]/50 flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">Import Applications</span>
              <span className="text-sm text-zinc-500 block mt-1">Select a previously exported Job Tracker CSV to merge back into your database.</span>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto">
              {importError && (
                <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 p-2 bg-rose-950/20 border border-rose-900/30 rounded">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {importError}
                </div>
              )}
              {importCount !== null && (
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 p-2 bg-emerald-950/20 border border-emerald-900/30 rounded">
                  <Check className="h-3 w-3 shrink-0" />
                  Successfully imported {importCount} job applications!
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  id="csv-file-picker"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isImporting}
                  className="w-full gap-1.5 font-bold relative"
                  onClick={() => document.getElementById('csv-file-picker')?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {isImporting ? 'Parsing CSV...' : 'Upload CSV File'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. THEME STYLING CONFIG (PLACEHOLDER) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Palette className="h-4.5 w-4.5 text-zinc-400" />
            <CardTitle className="text-base font-semibold">Theme Preferences</CardTitle>
          </div>
          <CardDescription>
            Personalize your workspace aesthetics. Dark mode is optimized for reduced eye strain during late-night applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex items-center gap-4">
            <div className="w-full sm:w-64">
              <Label htmlFor="theme-select">Visual Branding Preset</Label>
              <Select
                id="theme-select"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
              >
                <option value="obsidian">Obsidian Pure Dark (Default)</option>
                <option value="slate">Slate Cool Blue Dark</option>
                <option value="zinc">Zinc Charcoal Dark</option>
              </Select>
            </div>
            
            <div className="flex-1 hidden sm:flex items-center gap-3 p-4 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                Theme changes will save to current browser container preferences. Obsidian is pure black (900/950) with high contrast light-gray elements, aligned with Vercel and Linear standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. BROWSER EXTENSION PREPARATION & ABOUT */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Info className="h-4.5 w-4.5 text-zinc-400" />
            <CardTitle className="text-base font-semibold">Browser Extension Ready</CardTitle>
          </div>
          <CardDescription>
            Job Tracker exposes clean global API hooks to support browser extensions. Insert job listings directly into your dashboard in single-click from boards like LinkedIn, Stripe, or Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your web app automatically attaches a secure client-side insertion function to the global scope: <code className="font-mono bg-zinc-950 p-1 rounded text-zinc-300">window.JobTrackerAPI</code>. An extension content script can query this object in a snap.
          </p>
          
          <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <Code className="h-3.5 w-3.5 text-zinc-500" />
                Integration code for extension builders
              </div>
              <button 
                onClick={() => copyToClipboard(jsSnippet, setCopiedJs)}
                className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-semibold uppercase cursor-pointer bg-zinc-900/60 hover:bg-zinc-900 px-2.5 py-1 rounded-md border border-[#27272a]"
              >
                {copiedJs ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copiedJs ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-[10px] text-zinc-500 font-mono bg-black/40 p-3 rounded-md overflow-x-auto border border-[#27272a] max-h-[160px] leading-relaxed">
              {jsSnippet}
            </pre>
          </div>

          <div className="mt-2 text-xs text-zinc-500 border-t border-[#27272a] pt-4 flex flex-col gap-1">
            <span className="font-semibold text-zinc-400 block">About Job Tracker</span>
            <span>Version 1.0 (Build 2026.07)</span>
            <span>Created as a high-performance single-user dashboard optimized for extreme responsiveness, instant client caching, and modern tech-stack pipelines.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
