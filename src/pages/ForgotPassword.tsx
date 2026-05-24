import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function ForgotPassword() {
  const { resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="logo-badge" 
              style={{ width: 44, height: 44, borderRadius: 12, fontSize: '1rem', boxShadow: '0 8px 16px rgba(242, 201, 76, 0.2)' }}
            >
              <Calendar style={{ width: 22, height: 22 }} />
            </motion.div>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            margin: '0 0 6px',
            lineHeight: 1.1
          }}>
            Forgot password?
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Enter your email to receive a reset link
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: 'var(--shadow-modal)',
          position: 'relative',
        }}>
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@institution.edu"
                      className="field-input" style={{ paddingLeft: 40, borderRadius: 10, padding: '10px 14px 10px 40px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)',
                  }}>
                    <AlertCircle style={{ width: 16, height: 16, color: 'var(--danger-text)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4, gap: 8 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                      Sending Link...
                    </>
                  ) : (
                    <>Send Reset Link <ArrowRight style={{ width: 16, height: 16 }} /></>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '12px 0' }}
              >
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%', 
                  background: 'var(--success-bg)', color: 'var(--success-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>Check your email</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                  We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="btn btn-outline"
                  style={{ width: '100%', borderRadius: 10, padding: '10px 20px' }}
                >
                  Didn't receive it? Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link to="/login" className="link-hover" style={{ 
              fontSize: '0.875rem', color: 'var(--text-secondary)', 
              textDecoration: 'none', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: 8, fontWeight: 600 
            }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-placeholder)', marginTop: 16, lineHeight: 1.4 }}>
          Security is our top priority.<br/>
          © 2026 Timetable AI.
        </p>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .field-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-muted) !important;
        }
        .link-hover:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
}
