import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Mail, AlertTriangle, Plus, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Global Notification component that renders toasts from AppContext
 */
export default function GlobalNotification() {
  const { notification, clearNotification } = useApp();

  return (
    <AnimatePresence>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
          style={{
            position: 'fixed', top: 24, left: '50%',
            zIndex: 9999, 
            background: 'var(--surface)', 
            border: `1.5px solid ${
              notification.type === 'error' ? 'var(--danger-border)' : 
              notification.type === 'success' ? 'var(--success-border)' : 
              'var(--info-border)'
            }`,
            padding: '14px 20px', borderRadius: 16, boxShadow: 'var(--shadow-modal)',
            display: 'flex', alignItems: 'center', gap: 16,
            minWidth: 320, maxWidth: 450
          }}
        >
          <div style={{ 
            width: 36, height: 36, borderRadius: 10,
            background: 
              notification.type === 'error' ? 'var(--danger-bg)' : 
              notification.type === 'success' ? 'var(--success-bg)' : 
              'var(--info-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 
              notification.type === 'error' ? 'var(--danger-text)' : 
              notification.type === 'success' ? 'var(--success-text)' : 
              'var(--info-text)',
            flexShrink: 0
          }}>
            {notification.type === 'error' && <AlertTriangle size={18} />}
            {notification.type === 'success' && <Check size={18} />}
            {notification.type === 'info' && <Info size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{notification.title}</h5>
            <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notification.message}</p>
          </div>
          <button 
            onClick={clearNotification}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--text-placeholder)', padding: 4, display: 'flex' 
            }}
          >
            <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
