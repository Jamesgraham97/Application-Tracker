/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Euro, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { getApplications } from '../lib/dbService';
import { JobApplication, ApplicationStatus } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Input } from '../components/ui/FormElements';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table Sorting State
  const [sortField, setSortField] = useState<keyof JobApplication>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getApplications();
        setApplications(data);
      } catch (err) {
        console.error('Error loading applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate Statistics
  const totalApps = applications.length;
  
  // Status definitions
  const interviewsCount = applications.filter(app => 
    ['Recruiter Screen', 'Assessment', 'Interview', 'Final Interview'].includes(app.status)
  ).length;

  const offersCount = applications.filter(app => 
    ['Offer', 'Accepted'].includes(app.status)
  ).length;

  const rejectionsCount = applications.filter(app => app.status === 'Rejected').length;
  
  const waitingCount = applications.filter(app => 
    ['Applied', 'Saved'].includes(app.status)
  ).length;

  // Rates
  const interviewRate = totalApps > 0 ? (interviewsCount / totalApps) * 100 : 0;
  const offerRate = totalApps > 0 ? (offersCount / totalApps) * 100 : 0;
  const rejectionRate = totalApps > 0 ? (rejectionsCount / totalApps) * 100 : 0;

  // Active Applications: Saved, Rejected, Accepted, Ghosted, Withdrawn are "Inactive" or "Closed"
  // Active: Applied, Recruiter Screen, Assessment, Interview, Final Interview, Offer
  const activeAppsCount = applications.filter(app => 
    ['Applied', 'Recruiter Screen', 'Assessment', 'Interview', 'Final Interview', 'Offer'].includes(app.status)
  ).length;

  // Average Salary calculation
  const appsWithSalaries = applications.filter(app => app.salaryMin || app.salaryMax);
  const averageSalary = appsWithSalaries.length > 0
    ? appsWithSalaries.reduce((sum, app) => {
        const min = app.salaryMin || 0;
        const max = app.salaryMax || min; // if max not defined, default to min
        const avg = (min + max) / 2;
        return sum + avg;
      }, 0) / appsWithSalaries.length
    : 0;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Sort and Search filtering
  const handleSort = (field: keyof JobApplication) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredApps = applications.filter(app => {
    const query = searchQuery.toLowerCase();
    return (
      app.company.toLowerCase().includes(query) ||
      app.position.toLowerCase().includes(query) ||
      (app.location && app.location.toLowerCase().includes(query)) ||
      app.status.toLowerCase().includes(query)
    );
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    } else {
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  // Limit to 8 items on the dashboard for cleaner display, with a "View All" link
  const displayedApps = sortedApps.slice(0, 8);

  const SortIcon = ({ field }: { field: keyof JobApplication }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> 
      : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-1">Real-time tracker of your active job hunt. Keep pushing forward!</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            Add Application
          </button>
        </div>
      </div>

      {/* PRIMARY METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="col-span-2">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Applications</span>
              <div className="p-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-zinc-400">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-100 tracking-tight">{totalApps}</span>
              <span className="text-xs text-zinc-500 block mt-1">lifetime applications recorded</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active</span>
              <div className="p-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-100 tracking-tight">{activeAppsCount}</span>
              <span className="text-xs text-emerald-500/80 block mt-1">in active loops</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Interviews</span>
              <div className="p-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-100 tracking-tight">{interviewsCount}</span>
              <span className="text-xs text-zinc-500 block mt-1">{interviewRate.toFixed(0)}% interview rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Offers</span>
              <div className="p-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-emerald-400">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-100 tracking-tight">{offersCount}</span>
              <span className="text-xs text-emerald-400 block mt-1">{offerRate.toFixed(0)}% success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rejections</span>
              <div className="p-1.5 rounded-md bg-[#18181b] border border-[#27272a] text-rose-400">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-100 tracking-tight">{rejectionsCount}</span>
              <span className="text-xs text-zinc-500 block mt-1">{rejectionRate.toFixed(0)}% rejection rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-900/40">
                <Euro className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Average Target Salary</span>
                <span className="text-xl font-bold text-zinc-200 block mt-0.5">
                  {averageSalary > 0 ? formatCurrency(averageSalary) : '€0.00'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 font-mono">{appsWithSalaries.length} listed salaries</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-950/20 text-blue-400 border border-blue-900/40">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Interview Conv. Rate</span>
                <span className="text-xl font-bold text-zinc-200 block mt-0.5">
                  {interviewRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2 w-16 bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]">
              <div className="h-full bg-blue-500" style={{ width: `${interviewRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#18181b] text-zinc-400 border border-[#27272a]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pending Actions</span>
                <span className="text-xl font-bold text-zinc-200 block mt-0.5">
                  {waitingCount} Applications
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[#18181b] text-zinc-400 border border-[#27272a]">Waiting</span>
          </CardContent>
        </Card>
      </div>

      {/* QUICK TABLE SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Recent Applications</h3>
            <Badge variant="secondary">{filteredApps.length} match{filteredApps.length !== 1 ? 'es' : ''}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <Input
                type="text"
                placeholder="Search recent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Link 
              to="/applications"
              className="inline-flex items-center justify-center gap-1.5 px-4 h-9 text-xs font-semibold text-zinc-400 hover:text-zinc-100 border border-[#27272a] hover:border-zinc-700 bg-[#18181b] hover:bg-[#18181b]/80 rounded-lg transition-all cursor-pointer"
            >
              View All Applications
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/50 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase select-none">
                  <th 
                    className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center gap-1.5">
                      Company
                      <SortIcon field="company" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors"
                    onClick={() => handleSort('position')}
                  >
                    <div className="flex items-center gap-1.5">
                      Position
                      <SortIcon field="position" />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="p-4 hidden md:table-cell">Location</th>
                  <th className="p-4 hidden lg:table-cell">Salary Range</th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors text-right"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Updated
                      <SortIcon field="lastUpdated" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] bg-[#09090b]">
                {displayedApps.length > 0 ? (
                  displayedApps.map((app) => (
                    <tr 
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="hover:bg-[#18181b] transition-all duration-150 cursor-pointer group"
                    >
                      <td className="p-4">
                        <span className="font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                          {app.company}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-zinc-300">
                          {app.position}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          {app.location}
                          {app.remote && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-500 uppercase font-mono font-bold tracking-tight">
                              {app.remote}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-sm text-zinc-400 font-mono">
                        {app.salaryText || (app.salaryMin ? formatCurrency(app.salaryMin) : '—')}
                      </td>
                      <td className="p-4 text-right text-xs text-zinc-500 font-mono">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="h-3 w-3 text-zinc-600" />
                          {new Date(app.lastUpdated).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-600">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Briefcase className="h-8 w-8 text-zinc-700 stroke-[1.5]" />
                        <span className="text-sm font-semibold">No applications found</span>
                        <span className="text-xs text-zinc-500 max-w-xs">Try adjusting your search query or add a new job application.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
