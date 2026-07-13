/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  MapPin, 
  Briefcase, 
  Calendar,
  X,
  Plus
} from 'lucide-react';
import { getApplications } from '../lib/dbService';
import { JobApplication, ApplicationStatus, RemoteType } from '../types';
import { Card } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/FormElements';
import { Button } from '../components/ui/Button';

export default function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [remoteFilter, setRemoteFilter] = useState<string>('All');

  // Sorting State
  const [sortField, setSortField] = useState<keyof JobApplication>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getApplications();
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Extract unique locations and remote settings dynamically for filtering
  const uniqueLocations = Array.from(
    new Set(applications.map(app => app.location).filter(Boolean))
  ).sort();

  const uniqueRemotes = ['Remote', 'Hybrid', 'Onsite'];

  const allStatuses: ApplicationStatus[] = [
    'Saved', 'Applied', 'Recruiter Screen', 'Assessment', 'Interview', 
    'Final Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Ghosted'
  ];

  // Handle Sort Toggle
  const handleSort = (field: keyof JobApplication) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setLocationFilter('All');
    setRemoteFilter('All');
    setCurrentPage(1);
  };

  // Filter logic
  const filteredApps = applications.filter((app) => {
    // Search filter
    const matchesSearch = 
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(search.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(search.toLowerCase())) ||
      (app.source && app.source.toLowerCase().includes(search.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;

    // Location filter
    const matchesLocation = locationFilter === 'All' || app.location === locationFilter;

    // Remote filter
    const matchesRemote = remoteFilter === 'All' || app.remote === remoteFilter;

    return matchesSearch && matchesStatus && matchesLocation && matchesRemote;
  });

  // Sort logic
  const sortedApps = [...filteredApps].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    } else if (typeof aValue === 'number') {
      return sortDirection === 'asc'
        ? aValue - (bValue as number)
        : (bValue as number) - aValue;
    }
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedApps.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApps = sortedApps.slice(startIndex, endIndex);

  // Navigation handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const SortIcon = ({ field }: { field: keyof JobApplication }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> 
      : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />;
  };

  const isFilterActive = search !== '' || statusFilter !== 'All' || locationFilter !== 'All' || remoteFilter !== 'All';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Job Applications</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage and update every application in your pipeline.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/add')}
          className="w-full sm:w-auto font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
            <Input
              type="text"
              placeholder="Search company, title, tag..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9.5"
            />
          </div>

          {/* STATUS */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-9.5 text-xs text-zinc-300"
            >
              <option value="All">All Statuses</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </div>

          {/* REMOTE TYPE */}
          <div>
            <Select
              value={remoteFilter}
              onChange={(e) => { setRemoteFilter(e.target.value); setCurrentPage(1); }}
              className="h-9.5 text-xs text-zinc-300"
            >
              <option value="All">All Work Settings</option>
              {uniqueRemotes.map(rem => (
                <option key={rem} value={rem}>{rem}</option>
              ))}
            </Select>
          </div>

          {/* LOCATION */}
          <div>
            <Select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
              className="h-9.5 text-xs text-zinc-300"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* ACTIVE FILTER SUMMARY & RESET */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272a]">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-400 flex items-center gap-1 mr-1.5">
                <Filter className="h-3 w-3" />
                Active filters:
              </span>
              {search && <Badge variant="secondary" className="gap-1">Search: {search} <X className="h-3 w-3 cursor-pointer hover:text-zinc-100" onClick={() => setSearch('')} /></Badge>}
              {statusFilter !== 'All' && <Badge variant="secondary" className="gap-1">Status: {statusFilter} <X className="h-3 w-3 cursor-pointer hover:text-zinc-100" onClick={() => setStatusFilter('All')} /></Badge>}
              {remoteFilter !== 'All' && <Badge variant="secondary" className="gap-1">Setting: {remoteFilter} <X className="h-3 w-3 cursor-pointer hover:text-zinc-100" onClick={() => setRemoteFilter('All')} /></Badge>}
              {locationFilter !== 'All' && <Badge variant="secondary" className="gap-1">Location: {locationFilter} <X className="h-3 w-3 cursor-pointer hover:text-zinc-100" onClick={() => setLocationFilter('All')} /></Badge>}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[11px] h-7 text-zinc-500 hover:text-zinc-300 gap-1 font-semibold"
              onClick={handleResetFilters}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </Card>

      {/* APPLICATIONS TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#18181b]/50 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase select-none">
                <th 
                  className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors w-[22%]"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center gap-1.5">
                    Company
                    <SortIcon field="company" />
                  </div>
                </th>
                <th 
                  className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors w-[22%]"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center gap-1.5">
                    Position
                    <SortIcon field="position" />
                  </div>
                </th>
                <th 
                  className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors w-[13%]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="p-4 hidden sm:table-cell w-[15%]">Location</th>
                <th className="p-4 hidden md:table-cell w-[14%]">Salary</th>
                <th className="p-4 hidden lg:table-cell w-[10%]">Source</th>
                <th 
                  className="p-4 cursor-pointer hover:bg-[#18181b] transition-colors text-right w-[14%]"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center gap-1.5 justify-end">
                    Last Updated
                    <SortIcon field="lastUpdated" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] bg-[#09090b]">
              {paginatedApps.length > 0 ? (
                paginatedApps.map((app) => (
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
                    <td className="p-4 hidden sm:table-cell text-sm text-zinc-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{app.location || '—'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#18181b] border border-[#27272a] text-zinc-500 rounded uppercase font-mono tracking-wider shrink-0">
                          {app.remote}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-zinc-400 font-mono">
                      {app.salaryText || (app.salaryMin ? `${formatCurrency(app.salaryMin)}${app.salaryMax ? ` - ${formatCurrency(app.salaryMax)}` : ''}` : '—')}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-xs text-zinc-500">
                      <span className="px-2 py-0.5 bg-[#18181b]/50 border border-[#27272a] rounded-md text-zinc-400 max-w-[100px] truncate block">
                        {app.source || 'Direct'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-zinc-500 font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="h-3 w-3 text-zinc-600" />
                        {new Date(app.lastUpdated).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-zinc-600">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Briefcase className="h-10 w-10 text-zinc-700 stroke-[1.5]" />
                      <span className="text-sm font-semibold">No job applications match filters</span>
                      <span className="text-xs text-zinc-500 max-w-xs">Try adjusting your filters, clearing your search query, or adding a new record.</span>
                      {isFilterActive && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleResetFilters}
                          className="mt-2 font-semibold"
                        >
                          Reset Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#27272a] bg-[#09090b] flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-300">{startIndex + 1}</span> to{' '}
              <span className="font-medium text-zinc-300">{Math.min(endIndex, totalItems)}</span> of{' '}
              <span className="font-medium text-zinc-300">{totalItems}</span> applications
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`h-8 w-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      currentPage === p
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#18181b]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
