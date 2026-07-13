/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Recruiter Screen'
  | 'Assessment'
  | 'Interview'
  | 'Final Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Ghosted';

export type RemoteType = 'Onsite' | 'Hybrid' | 'Remote';

export interface TimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  notes?: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  location: string;
  remote: RemoteType;
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
  source?: string;
  jobUrl?: string;
  notes?: string;
  appliedDate?: string;
  lastUpdated: string;
  createdAt: string;
  timeline?: TimelineEvent[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
