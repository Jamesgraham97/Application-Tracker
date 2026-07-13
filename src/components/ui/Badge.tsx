/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ApplicationStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'status';
  status?: ApplicationStatus;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className = '' }: BadgeProps) {
  if (variant === 'status' && status) {
    return <StatusBadge status={status} className={className} />;
  }

  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors border';
  
  let variantClasses = '';
  switch (variant) {
    case 'outline':
      variantClasses = 'border-[#27272a] text-zinc-400 bg-transparent';
      break;
    case 'secondary':
      variantClasses = 'border-[#27272a] text-zinc-300 bg-[#18181b]';
      break;
    default:
      variantClasses = 'border-transparent text-white bg-zinc-800';
      break;
  }

  return (
    <span className={`${base} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }: { status: ApplicationStatus; className?: string }) {
  const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 border w-fit shadow-xs';
  
  let colorClasses = '';
  switch (status) {
    case 'Saved':
      colorClasses = 'bg-zinc-900/60 text-zinc-400 border-zinc-800';
      break;
    case 'Applied':
      colorClasses = 'bg-blue-950/30 text-blue-400 border-blue-900/50';
      break;
    case 'Recruiter Screen':
      colorClasses = 'bg-purple-950/30 text-purple-400 border-purple-900/50';
      break;
    case 'Assessment':
      colorClasses = 'bg-amber-950/30 text-amber-400 border-amber-900/50';
      break;
    case 'Interview':
      colorClasses = 'bg-teal-950/30 text-teal-400 border-teal-900/50';
      break;
    case 'Final Interview':
      colorClasses = 'bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-900/50';
      break;
    case 'Offer':
      colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 font-semibold shadow-xs shadow-emerald-950/50 animate-pulse';
      break;
    case 'Accepted':
      colorClasses = 'bg-green-950/60 text-green-300 border-green-700/60 font-bold';
      break;
    case 'Rejected':
      colorClasses = 'bg-rose-950/30 text-rose-400 border-rose-900/50';
      break;
    case 'Withdrawn':
      colorClasses = 'bg-neutral-900/60 text-neutral-500 border-neutral-800';
      break;
    case 'Ghosted':
      colorClasses = 'bg-neutral-950 text-zinc-500 border-neutral-900';
      break;
    default:
      colorClasses = 'bg-zinc-900 text-zinc-400 border-zinc-800';
      break;
  }

  return (
    <span className={`${base} ${colorClasses} ${className}`}>
      {status}
    </span>
  );
}
