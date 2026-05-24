import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useApp();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsValidSession(true);
      } else {
        setError('Your reset link is invalid or has expired.');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      // First try to re-authenticate if currentPassword is provided
      if (currentPassword) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
          });
          if (signInError) throw new Error('Incorrect current password');
        }
      }

      await updatePassword(password);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--accent)', width: 40, height: 40 }} />
      </div>
    );
  }

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
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 10,
            marginBottom: 16 
          }}>
            <div style={{
              width: 40, height: 40,
              background: 'var(--accent)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-text)',
              boxShadow: '0 8px 16px rgba(242, 201, 76, 0.2)'
            }}>
              <Zap size={22} fill="currentColor" />
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em'
            }}>Timegen</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            margin: '0 0 6px',
            lineHeight: 1.1
          }}>
            Reset password
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Enter your credentials to update your password
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
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%', 
                background: 'var(--success-bg)', color: 'var(--success-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>Password updated!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your password has been changed successfully. Redirecting you to login...
              </p>
              <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  style={{ height: '100%', background: 'var(--success-text)' }}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!isValidSession && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)',
                }}>
                  <AlertCircle style={{ width: 18, height: 18, color: 'var(--danger-text)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                </div>
              )}

              {isValidSession && (
                <>
                  <div>
                    <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
                      <input
                        type={showPassword ? "text" : "password"} 
                        required value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="field-input" style={{ paddingLeft: 40, paddingRight: 40, borderRadius: 10, padding: '10px 14px 10px 40px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
                      <input
                        type={showPassword ? "text" : "password"} 
                        required value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="field-input" style={{ paddingLeft: 40, paddingRight: 40, borderRadius: 10, padding: '10px 14px 10px 40px', fontSize: '0.9rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--text-placeholder)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
                      <input
                        type={showPassword ? "text" : "password"} 
                        required value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="field-input" style={{ paddingLeft: 40, paddingRight: 40, borderRadius: 10, padding: '10px 14px 10px 40px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ 
                        width: 14, height: 14, borderRadius: 99, 
                        background: password.length >= 6 ? 'var(--success-bg)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {password.length >= 6 && <Check size={10} color="var(--success-text)" />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: password.length >= 6 ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>At least 6 characters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ 
                        width: 14, height: 14, borderRadius: 99, 
                        background: (password === confirmPassword && password !== '') ? 'var(--success-bg)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {(password === confirmPassword && password !== '') && <Check size={10} color="var(--success-text)" />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: (password === confirmPassword && password !== '') ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>Passwords match</span>
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
                    disabled={isSubmitting || password.length < 6 || password !== confirmPassword}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4, gap: 8 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                        Updating...
                      </>
                    ) : (
                      <>Update Password <ArrowRight style={{ width: 16, height: 16 }} /></>
                    )}
                  </motion.button>
                </>
              )}
              
              {!isValidSession && (
                <button 
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: 10, padding: '12px 20px' }}
                >
                  Request a new link
                </button>
              )}
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-placeholder)', marginTop: 16, lineHeight: 1.4 }}>
          Choose a strong password to stay secure.<br/>
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
      `}</style>
    </div>
  );
}
