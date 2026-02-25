import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LucideIcon, Plus } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export function Card({ children, className, title, subtitle, headerAction, ...props }: CardProps) {
  return (
    <div className={cn("bg-dark-surface rounded-3xl border border-dark-border shadow-xl overflow-hidden", className)} {...props}>
      {(title || headerAction) && (
        <div className="px-8 py-5 border-b border-dark-border flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-display font-semibold text-text-header">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 active:scale-95',
    secondary: 'bg-dark-border text-text-main hover:bg-[var(--color-chip-bg)] active:scale-95',
    outline: 'bg-transparent border border-dark-border text-text-main hover:bg-dark-border active:scale-95',
    ghost: 'bg-transparent text-[var(--color-text-muted)] hover:text-text-main hover:bg-dark-border/40 active:scale-95',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl gap-2',
    md: 'px-6 py-3 rounded-2xl gap-2.5',
    lg: 'px-8 py-4 text-lg rounded-2xl gap-3',
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn("w-5 h-5", size === 'sm' && 'w-4 h-4')} />}
      {children}
    </button>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-dark-bg/50 rounded-[2rem] flex items-center justify-center mb-8 border border-dark-border shadow-inner">
        <Icon className="w-10 h-10 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-xl font-display font-bold text-text-header mb-3">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={Plus} className="shadow-xl shadow-brand-500/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function Badge({ children, variant = 'neutral', className, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-[var(--color-chip-bg)] text-[var(--color-chip-text)] border-[var(--color-chip-border)]',
  };

  return (
    <span className={cn("px-3 py-1 rounded-lg text-xs font-bold border", variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-dark-surface rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl border border-dark-border overflow-hidden">
        <div className="px-8 py-6 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-xl font-display font-bold text-text-header">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-text-main transition-colors p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
