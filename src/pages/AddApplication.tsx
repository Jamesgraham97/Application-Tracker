/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, ArrowLeft, Plus, DollarSign, MapPin, Compass, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { createApplication } from '../lib/dbService';
import { ApplicationStatus, RemoteType } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select, Label } from '../components/ui/FormElements';

export default function AddApplication() {
  const navigate = useNavigate();

  // Form State
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState<RemoteType>('Remote');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [salaryText, setSalaryText] = useState('');
  const [source, setSource] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);

  // Validation & Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!company.trim()) {
      setFormError('Company name is required.');
      return;
    }
    if (!position.trim()) {
      setFormError('Position title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newApp = await createApplication({
        company: company.trim(),
        position: position.trim(),
        status,
        location: location.trim(),
        remote,
        salaryMin: salaryMin === '' ? undefined : Number(salaryMin),
        salaryMax: salaryMax === '' ? undefined : Number(salaryMax),
        salaryText: salaryText.trim(),
        source: source.trim(),
        jobUrl: jobUrl.trim(),
        notes: notes.trim(),
        appliedDate: status !== 'Saved' ? appliedDate : undefined
      });

      // Navigate to detail view
      navigate(`/applications/${newApp.id}`);
    } catch (err) {
      console.error('Error adding application:', err);
      setFormError('Failed to save the job application. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allStatuses: ApplicationStatus[] = [
    'Saved', 'Applied', 'Recruiter Screen', 'Assessment', 'Interview', 
    'Final Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn', 'Ghosted'
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-[#27272a] pb-5">
        <Link 
          to="/" 
          className="p-2 rounded-lg border border-[#27272a] bg-[#18181b]/60 hover:bg-[#18181b] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Add New Job Application</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Track a new opportunity in your job hunt pipeline.</p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-400 text-sm font-medium flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          {formError}
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Job Metadata</CardTitle>
            <CardDescription>Fill out details about the role, compensation, and pipeline status.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 flex flex-col gap-6">
            {/* Row 1: Company and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company <span className="text-rose-500">*</span></Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g. Stripe, Google, Microsoft"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="position">Position Title <span className="text-rose-500">*</span></Label>
                <Input
                  id="position"
                  type="text"
                  placeholder="e.g. Senior Product Designer, Backend Developer"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Row 2: Status and Work Setting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Application Pipeline Status</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  disabled={isSubmitting}
                >
                  {allStatuses.map((stat) => (
                    <option key={stat} value={stat}>{stat}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="remote">Work setting</Label>
                <Select
                  id="remote"
                  value={remote}
                  onChange={(e) => setRemote(e.target.value as RemoteType)}
                  disabled={isSubmitting}
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </Select>
              </div>

              {/* Conditionally display date applied based on status */}
              {status !== 'Saved' ? (
                <div>
                  <Label htmlFor="applied-date">Date Applied</Label>
                  <Input
                    id="applied-date"
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9.5 text-xs text-zinc-300"
                  />
                </div>
              ) : (
                <div className="opacity-40">
                  <Label>Date Applied</Label>
                  <Input
                    type="text"
                    value="N/A (Role is Saved)"
                    disabled
                    className="h-9.5 text-xs bg-zinc-950/20 text-zinc-600 font-medium"
                  />
                </div>
              )}
            </div>

            {/* Row 3: Location and Referral Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  Office Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote US"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="source" className="flex items-center gap-1.5">
                  <Compass className="h-3 w-3 text-zinc-500" />
                  Application Source / Referral
                </Label>
                <Input
                  id="source"
                  type="text"
                  placeholder="e.g. LinkedIn, Indeed, Twitter, Referral"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Row 4: Salary Min, Salary Max, Salary Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#27272a] pt-4">
              <div>
                <Label htmlFor="salary-min" className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-zinc-500" />
                  Min Salary (Annual USD)
                </Label>
                <Input
                  id="salary-min"
                  type="number"
                  placeholder="e.g. 120000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="salary-max" className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-zinc-500" />
                  Max Salary (Annual USD)
                </Label>
                <Input
                  id="salary-max"
                  type="number"
                  placeholder="e.g. 160000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="salary-text">Compensation Notes</Label>
                <Input
                  id="salary-text"
                  type="text"
                  placeholder="e.g. $130k base + stock options"
                  value={salaryText}
                  onChange={(e) => setSalaryText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Row 5: Job Listing URL */}
            <div className="border-t border-[#27272a] pt-4">
              <Label htmlFor="job-url" className="flex items-center gap-1.5">
                <LinkIcon className="h-3 w-3 text-zinc-500" />
                Job Posting URL
              </Label>
              <Input
                id="job-url"
                type="url"
                placeholder="https://company.com/careers/role-link"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Row 6: Notes & Bulletpoints */}
            <div className="border-t border-[#27272a] pt-4">
              <Label htmlFor="notes">Notes & Preparations</Label>
              <Textarea
                id="notes"
                placeholder="Insert contact information, elevator pitch ideas, custom prep, key technology tags..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[140px]"
              />
            </div>
          </CardContent>

          {/* ACTIONS FOOTER */}
          <div className="px-6 py-4 border-t border-[#27272a] bg-[#18181b]/50 flex items-center justify-end gap-3">
            <Link to="/">
              <Button 
                variant="outline" 
                disabled={isSubmitting}
                className="font-medium"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Application'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
