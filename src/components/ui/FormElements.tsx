/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Label component
export function Label({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block ${className}`}
    >
      {children}
    </label>
  );
}

// Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', id, ...props }, ref) => {
    return (
      <input
        id={id}
        type={type}
        className={`flex w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors duration-200 focus:border-zinc-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', id, ...props }, ref) => {
    return (
      <textarea
        id={id}
        className={`flex min-h-[100px] w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors duration-200 focus:border-zinc-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-relaxed ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// Select component (Wrapper with SVG arrow)
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', id, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          id={id}
          className={`flex w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2 pr-10 text-sm text-zinc-100 transition-colors duration-200 focus:border-zinc-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer ${className}`}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">
          <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
