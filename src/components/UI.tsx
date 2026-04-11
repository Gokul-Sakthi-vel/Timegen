import React from 'react';
import { LucideIcon, Plus, X, Trash2, CheckCircle2, WifiOff, RotateCcw, AlertTriangle, ShieldX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', title, subtitle, headerAction, style, ...props }: CardProps) {
  return (
    <div className={`card ${className}`} style={{ overflow: 'hidden', ...style }} {...props}>
      {(title || headerAction) && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            {title && <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: '20px' }}>
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
  style?: React.CSSProperties;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-outline',
    outline: 'btn btn-outline',
    ghost: 'btn btn-ghost',
    danger: 'btn btn-danger',
  }[variant];

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button className={`${variantClass} ${sizeClass} ${className}`} {...props}>
      {Icon && <Icon style={{ width: size === 'sm' ? 14 : 16, height: size === 'sm' ? 14 : 16, flexShrink: 0 }} />}
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: '64px 32px', textAlign: 'center',
        background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 24,
        minHeight: '340px'
      }}
    >
      <div style={{
        width: 84, height: 84,
        background: 'var(--accent-muted)',
        borderRadius: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        border: '1.5px solid var(--accent-border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}>
        <Icon style={{ width: 32, height: 32, color: 'var(--accent-text)' }} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, marginBottom: 32 }}>{description}</p>
      {actionLabel && onAction && (
        <button 
          className="btn btn-primary" 
          onClick={onAction}
          style={{ padding: '12px 32px', borderRadius: 12, fontWeight: 700 }}
        >
          <Plus style={{ width: 18, height: 18 }} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  key?: React.Key;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>{children}</span>
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface-2)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ErrorModal({
  isOpen, onClose, onRetry, title, message, type = 'error'
}: {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  title: string;
  message: string;
  type?: 'error' | 'offline' | 'session';
}) {
  if (!isOpen) return null;

  const config = {
    offline: {
      icon: WifiOff,
      color: 'var(--warning-text)',
      bg: 'var(--warning-bg)',
      accent: 'var(--warning-border)'
    },
    session: {
      icon: ShieldX,
      color: 'var(--danger-text)',
      bg: 'var(--danger-bg)',
      accent: 'var(--danger-border)'
    },
    error: {
      icon: AlertTriangle,
      color: 'var(--danger-text)',
      bg: 'var(--danger-bg)',
      accent: 'var(--danger-border)'
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className="modal-backdrop" style={{ zIndex: 100 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-box"
        style={{ maxWidth: 400, padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: config.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            border: `1.5px solid ${config.accent}20`
          }}>
            <Icon style={{ width: 32, height: 32, color: config.color }} />
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>

        <div style={{
          padding: '16px 24px',
          background: 'var(--surface-2)',
          borderTop: '1.5px solid var(--border)',
          display: 'flex', gap: 12, justifyContent: 'center',
        }}>
          <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: 10, flex: 1, padding: '10px' }}>
            Cancel
          </button>
          {onRetry && (
            <button
              className="btn btn-primary"
              style={{
                borderRadius: 10,
                flex: 1,
                padding: '10px',
                background: type === 'offline' ? 'var(--accent)' : 'var(--text-primary)',
                color: type === 'offline' ? 'var(--accent-text)' : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontWeight: 700
              }}
              onClick={onRetry}
            >
              <RotateCcw style={{ width: 16, height: 16 }} />
              Retry
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning';
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-box"
        style={{ maxWidth: 400, padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>
        <div style={{
          padding: '16px 24px',
          background: 'var(--surface-2)',
          borderTop: '1.5px solid var(--border)',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
        }}>
          <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: 10, padding: '8px 20px' }}>
            Cancel
          </button>
          <button
            className="btn"
            style={{
              borderRadius: 10,
              padding: '8px 24px',
              backgroundColor: type === 'danger' ? 'var(--danger-text)' : 'var(--accent)',
              color: type === 'danger' ? 'var(--bg)' : 'var(--accent-text)',
              fontWeight: 700
            }}
            onClick={() => { onConfirm(); }}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function BulkActionBar({
  selectedCount, onDelete, onCancel, onSelectAll, onDeselectAll, itemName
}: {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  itemName: string;
}) {
  const isPlural = selectedCount !== 1;
  const nameLabel = isPlural
    ? itemName.endsWith('y') ? itemName.slice(0, -1) + 'ies' : itemName + 's'
    : itemName;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 24px', background: 'var(--accent-muted)',
            border: '1.5px solid var(--accent-border)', borderRadius: 999,
            marginBottom: 20,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: 'var(--accent)', color: 'var(--accent-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.875rem',
            }}>
              {selectedCount}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>
              {selectedCount} {nameLabel} selected
            </span>
          </div>

          <div style={{ width: 1.5, height: 24, background: 'var(--accent-border)', margin: '0 8px' }} />

          <div style={{ display: 'flex', gap: 6 }}>
            {onSelectAll && (
              <button
                onClick={onSelectAll}
                className="btn btn-outline btn-sm"
                style={{ borderRadius: 999, fontSize: '0.75rem', padding: '6px 14px', background: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
              >
                Select All
              </button>
            )}
            {onDeselectAll && (
              <button
                onClick={onDeselectAll}
                className="btn btn-outline btn-sm"
                style={{ borderRadius: 999, fontSize: '0.75rem', padding: '6px 14px', background: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
              >
                Deselect All
              </button>
            )}
            <button
              onClick={onDelete}
              className="btn btn-sm"
              style={{
                borderRadius: 999, fontSize: '0.75rem', padding: '6px 16px',
                background: 'var(--danger-text)', color: 'var(--surface)',
                fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <Trash2 style={{ width: 14, height: 14 }} /> Delete
            </button>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--accent-border)', margin: '0 8px' }} />

          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              padding: '6px 12px',
            }}
          >
            Cancel
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function cn(...args: (string | boolean | undefined | null)[]) {
  return args.filter(Boolean).join(' ');
}
