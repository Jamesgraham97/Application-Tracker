/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function Button({ 
  children, 
  variant = 'secondary', 
  size = 'md', 
  className = '', 
  type = 'button',
  disabled = false,
  onClick,
  ...props 
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-400';
  
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-white hover:bg-zinc-200 text-black font-semibold shadow-xs';
      break;
    case 'secondary':
      variantClasses = 'bg-[#18181b] hover:bg-zinc-900 text-zinc-200 border border-[#27272a] hover:border-zinc-700 shadow-xs';
      break;
    case 'outline':
      variantClasses = 'bg-transparent hover:bg-[#18181b] text-zinc-300 border border-[#27272a] hover:border-zinc-700';
      break;
    case 'danger':
      variantClasses = 'bg-rose-950/40 hover:bg-rose-950/70 text-rose-400 border border-rose-900/50 hover:border-rose-800';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent hover:bg-[#18181b] text-zinc-400 hover:text-zinc-200';
      break;
    case 'link':
      variantClasses = 'bg-transparent text-zinc-400 hover:text-zinc-100 underline-offset-4 hover:underline p-0!';
      break;
  }

  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'text-xs px-3 py-1.5 gap-1.5 h-8';
      break;
    case 'md':
      sizeClasses = 'text-sm px-4 py-2 gap-2 h-10';
      break;
    case 'lg':
      sizeClasses = 'text-base px-5 py-2.5 gap-2.5 h-12';
      break;
    case 'icon':
      sizeClasses = 'h-10 w-10 p-0 text-sm';
      break;
  }

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
