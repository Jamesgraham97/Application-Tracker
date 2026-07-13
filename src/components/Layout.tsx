/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  PlusCircle, 
  Settings, 
  Menu, 
  X, 
  Database,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';
import { isSupabaseConnected } from '../lib/dbService';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Check Supabase connection on mount and location changes
  useEffect(() => {
    setDbConnected(isSupabaseConnected());
  }, [location]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: Briefcase },
    { name: 'Add Application', path: '/add', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/applications') return 'Applications';
    if (path === '/add') return 'Add Application';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/applications/')) return 'Application Details';
    return 'Job Tracker';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-radial from-zinc-900/10 via-transparent to-transparent pointer-events-none z-0" />

      <div className="flex flex-1 relative z-10">
        {/* SIDEBAR - DESKTOP */}
        <aside className="hidden md:flex flex-col w-60 border-r border-[#27272a] bg-[#09090b] sticky top-0 h-screen z-20">
          <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-xs shadow-blue-500/25">
                J
              </div>
              <span className="font-semibold text-lg tracking-tight text-zinc-100">JobTracker</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#18181b] text-white font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-[#18181b]/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Connected Status & Profile Footer */}
          <div className="p-4 border-t border-[#27272a] flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#18181b] cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-white">
                AC
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Alex Chen</p>
                <p className="text-[10px] text-zinc-500 truncate">Personal Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181b]/50 border border-[#27272a]">
              <Database className={`h-3.5 w-3.5 ${dbConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-[10px] font-mono text-zinc-400 truncate">
                    {dbConnected ? 'Cloud Synced' : 'Offline Storage'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* SIDEBAR - MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="absolute top-0 left-0 bottom-0 w-72 bg-[#09090b] border-r border-[#27272a] p-6 flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#27272a] pb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base">
                    J
                  </div>
                  <span className="font-semibold text-lg tracking-tight text-zinc-100">JobTracker</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#18181b] text-white font-medium'
                          : 'text-zinc-400 hover:text-white hover:bg-[#18181b]/50'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#27272a] pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#18181b] cursor-pointer" onClick={() => { setMobileMenuOpen(false); navigate('/settings'); }}>
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-white">
                    AC
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">Alex Chen</p>
                    <p className="text-[10px] text-zinc-500 truncate">Personal Workspace</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[#18181b] border border-[#27272a]">
                  <Database className={`h-4.5 w-4.5 ${dbConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div>
                    <span className="text-xs font-semibold text-zinc-300 block">Database Mode</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {dbConnected ? 'Supabase Connected' : 'Local Storage'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* STICKY TOP NAV BAR */}
          <header className="sticky top-0 z-30 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-zinc-200 md:hidden cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <span className="font-medium text-zinc-500">Overview</span>
                <span className="text-zinc-700">/</span>
                <h1 className="font-semibold text-zinc-100 tracking-tight">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {location.pathname !== '/add' && (
                <button
                  onClick={() => navigate('/add')}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Application
                </button>
              )}
              
              {/* Simple User Indicator */}
              <div className="h-8 w-8 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-xs text-zinc-300 select-none font-medium">
                AC
              </div>
            </div>
          </header>

          {/* SCROLLABLE MAIN CONTENT */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
