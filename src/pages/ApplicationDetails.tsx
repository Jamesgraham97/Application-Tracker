/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Link as LinkIcon, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  MessageSquare,
  Compass,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  getApplication, 
  updateApplication, 
  deleteApplication, 
  addTimelineEvent 
} from '../lib/dbService';
import { JobApplication, ApplicationStatus, RemoteType } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select, Label } from '../components/ui/FormElements';

export default function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields state
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('Saved');
  const [editLocation, setEditLocation] = useState('');
  const [editRemote, setEditRemote] = useState<RemoteType>('Remote');
  const [editSalaryMin, setEditSalaryMin] = useState<number | ''>('');
  const [editSalaryMax, setEditSalaryMax] = useState<number | ''>('');
  const [editSalaryText, setEditSalaryText] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editJobUrl, setEditJobUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAppliedDate, setEditAppliedDate] = useState('');

  // Status updating timeline state
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Saved');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadApp() {
      if (!id) return;
      try {
        const data = await getApplication(id);
        if (data) {
          setApplication(data);
          // Populate edit state
          setEditCompany(data.company);
          setEditPosition(data.position);
          setEditStatus(data.status);
          setEditLocation(data.location || '');
          setEditRemote(data.remote);
          setEditSalaryMin(data.salaryMin !== undefined ? data.salaryMin : '');
          setEditSalaryMax(data.salaryMax !== undefined ? data.salaryMax : '');
          setEditSalaryText(data.salaryText || '');
          setEditSource(data.source || '');
          setEditJobUrl(data.jobUrl || '');
          setEditNotes(data.notes || '');
          setEditAppliedDate(data.appliedDate || '');
          setNewStatus(data.status);
        } else {
          setError('Job application not found.');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to retrieve job details.');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !application) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await addTimelineEvent(
        id, 
        newStatus, 
        statusNotes.trim() || `Status moved to: ${newStatus}`
      );
      setApplication(updated);
      setEditStatus(newStatus);
      setStatusNotes('');
    } catch (err) {
      console.error('Error adding timeline event:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!id || !application) return;

    try {
      const updates: Partial<JobApplication> = {
        company: editCompany.trim(),
        position: editPosition.trim(),
        status: editStatus,
        location: editLocation.trim(),
        remote: editRemote,
        salaryMin: editSalaryMin === '' ? undefined : Number(editSalaryMin),
        salaryMax: editSalaryMax === '' ? undefined : Number(editSalaryMax),
        salaryText: editSalaryText.trim(),
        source: editSource.trim(),
        jobUrl: editJobUrl.trim(),
        notes: editNotes.trim(),
        appliedDate: editAppliedDate || undefined
      };

      const updated = await updateApplication(id, updates);
      setApplication(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving updates:', err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`Are you sure you want to delete your application for ${application?.company}?`)) {
      try {
        const success = await deleteApplication(id);
        if (success) {
          navigate('/applications');
        }
      } catch (err) {
        console.error('Error deleting application:', err);
      }
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

  const allStatuses: ApplicationStatus[] = [
    'Saved', 'Applied', 'Recruiter Screen', 'Assessment', 'Interview', 
    'Final Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Ghosted'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500 stroke-[1.5]" />
        <h3 className="text-xl font-semibold text-zinc-200">Application Not Found</h3>
        <p className="text-zinc-500 text-sm max-w-md">The application you are looking for does not exist or may have been deleted.</p>
        <Link to="/applications">
          <Button variant="secondary">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-5">
        <Link 
          to="/applications" 
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
        
        <div className="flex items-center gap-2.5">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                className="gap-1.5 h-9"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSaveDetails}
                className="gap-1.5 h-9"
              >
                <Check className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="gap-1.5 h-9"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Details
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDelete}
                className="gap-1.5 h-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TWO-COLUMN GRID VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: DETAILS & INFO */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-start gap-4">
              <div className="flex flex-col gap-2 flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <Label htmlFor="edit-company">Company</Label>
                      <Input
                        id="edit-company"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        className="font-semibold text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-position">Position</Label>
                      <Input
                        id="edit-position"
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold text-zinc-100">{application.company}</CardTitle>
                    <CardDescription className="text-base text-zinc-400 font-medium">{application.position}</CardDescription>
                  </>
                )}
              </div>
              {!isEditing && <StatusBadge status={application.status} className="text-sm px-3 py-1.5" />}
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Job settings list */}
              <div className="flex flex-col gap-5">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Location</span>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="e.g. San Francisco, CA"
                        />
                        <Select
                          value={editRemote}
                          onChange={(e) => setEditRemote(e.target.value as RemoteType)}
                          className="w-32"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </Select>
                      </div>
                    ) : (
                      <span className="text-zinc-200 font-medium text-sm flex items-center gap-2 mt-1">
                        {application.location || 'Not Specified'}
                        <Badge variant="secondary" className="font-mono text-[10px]">{application.remote}</Badge>
                      </span>
                    )}
                  </div>
                </div>

                {/* Salary */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Salary Range</span>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1.5">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editSalaryMin}
                            onChange={(e) => setEditSalaryMin(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Min (e.g. 120000)"
                            className="text-xs"
                          />
                          <span className="text-zinc-600 text-xs">—</span>
                          <Input
                            type="number"
                            value={editSalaryMax}
                            onChange={(e) => setEditSalaryMax(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Max (e.g. 150000)"
                            className="text-xs"
                          />
                        </div>
                        <Input
                          value={editSalaryText}
                          onChange={(e) => setEditSalaryText(e.target.value)}
                          placeholder="Salary Notes (e.g. $120k base + bonus)"
                          className="text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-zinc-200 font-mono text-sm block mt-1">
                        {application.salaryText || (application.salaryMin ? `${formatCurrency(application.salaryMin)}${application.salaryMax ? ` - ${formatCurrency(application.salaryMax)}` : ''}` : 'No salary range listed')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Source */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Referral/Job Source</span>
                    {isEditing ? (
                      <Input
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        placeholder="e.g. LinkedIn, Referral"
                        className="mt-1.5"
                      />
                    ) : (
                      <span className="text-zinc-200 text-sm font-medium block mt-1">
                        {application.source || 'Direct Website Application'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timing settings */}
              <div className="flex flex-col gap-5">
                {/* Applied Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Date Applied</span>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editAppliedDate}
                        onChange={(e) => setEditAppliedDate(e.target.value)}
                        className="mt-1.5 h-9 text-xs"
                      />
                    ) : (
                      <span className="text-zinc-200 text-sm font-medium block mt-1">
                        {application.appliedDate 
                          ? new Date(application.appliedDate).toLocaleDateString(undefined, { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Not applied yet / Saved item'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Last Updated</span>
                    <span className="text-zinc-300 text-sm font-mono block mt-1">
                      {new Date(application.lastUpdated).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Job URL */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Job Listing URL</span>
                    {isEditing ? (
                      <Input
                        value={editJobUrl}
                        onChange={(e) => setEditJobUrl(e.target.value)}
                        placeholder="https://company.com/job"
                        className="mt-1.5"
                      />
                    ) : (
                      application.jobUrl ? (
                        <a 
                          href={application.jobUrl} 
                          target="_blank" 
                          rel="noreferrer referrer" 
                          className="text-zinc-400 hover:text-zinc-200 text-sm font-medium underline flex items-center gap-1.5 mt-1 truncate"
                        >
                          Visit Posting
                          <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-sm block mt-1">No link provided</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APPLICATION NOTES */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-zinc-400" />
                <CardTitle className="text-base font-semibold">Job Notes & Highlights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {isEditing ? (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Insert bullet points, follow-ups, interview preps, core technologies, elevator pitches..."
                  className="min-h-[160px] text-sm"
                />
              ) : (
                <div className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                  {application.notes || (
                    <span className="text-zinc-600 italic block">No detailed notes added. Click &quot;Edit Details&quot; to supplement interview preparations, key contact people, panel members, or special task outlines.</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: TIMELINE & STATUS UPDATE */}
        <div className="flex flex-col gap-6">
          {/* QUICK STATUS UPDATE PANEL */}
          {!isEditing && (
            <Card>
              <CardHeader className="pb-3 border-b border-[#27272a]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Update Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <form onSubmit={handleUpdateStatus} className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="status-select">New status</Label>
                    <Select
                      id="status-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    >
                      {allStatuses.map((stat) => (
                        <option key={stat} value={stat}>
                          {stat}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status-notes">Timeline notes</Label>
                    <Textarea
                      id="status-notes"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g. Completed initial phone screen, very friendly recruiter. Offered technical task next."
                      className="min-h-[80px] text-xs placeholder:text-zinc-600"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    disabled={isUpdatingStatus || newStatus === application.status && !statusNotes.trim()}
                    className="w-full mt-1.5 font-bold"
                  >
                    {isUpdatingStatus ? 'Posting Update...' : 'Log Status Change'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* CHRONOLOGICAL TIMELINE */}
          <Card>
            <CardHeader className="pb-2 border-b border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Activity History</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l border-[#27272a] pl-4 py-1 flex flex-col gap-5">
                {application.timeline && application.timeline.length > 0 ? (
                  [...application.timeline]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((event, index) => (
                      <div key={event.id || index} className="relative group">
                        {/* Timeline node circle */}
                        <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#27272a] border border-[#09090b] flex items-center justify-center">
                          <div className={`h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-emerald-500 animate-ping-once' : 'bg-zinc-600'}`} />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={event.status} className="text-[10px] px-1.5 py-0.2" />
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(event.createdAt).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {event.notes && (
                            <p className="text-zinc-400 text-xs leading-relaxed mt-0.5">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <span className="text-xs text-zinc-500 italic block">No logged events.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
