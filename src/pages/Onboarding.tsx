import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Check, Loader2, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, completeOnboarding } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/', { replace: true });
    }
  }, [navigate, user?.onboardingCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !name.trim()) return;

    setError('');
    setIsSaving(true);
    try {
      await completeOnboarding(name);
      navigate(from === '/onboarding' ? '/' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish setup. Please try again.');
    } finally {
      setIsSaving(false);
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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="logo-badge" style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px' }}>
            <Calendar style={{ width: 24, height: 24 }} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            Finish setting up Timegen
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            Confirm your profile before entering the workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            padding: 24,
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
            <ShieldCheck style={{ width: 18, height: 18, color: 'var(--accent-text)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              First-time setup is required once per account.
            </span>
          </div>

          <div>
            <label className="field-label">Profile Name</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="field-input"
                placeholder="Enter your name"
                style={{ width: '100%', paddingLeft: 40 }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              Signed in as {user?.email}
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setAcceptedTerms(prev => !prev)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAcceptedTerms(prev => !prev);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              border: '1.5px solid var(--border)',
              background: acceptedTerms ? 'var(--accent-muted)' : 'var(--surface)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `1.5px solid ${acceptedTerms ? 'var(--accent)' : 'var(--border-2)'}`,
              background: acceptedTerms ? 'var(--accent)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}>
              {acceptedTerms && <Check style={{ width: 12, height: 12, color: 'var(--accent-text)', strokeWidth: 3 }} />}
            </span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              I agree to the <Link to="/terms" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Terms & Conditions</Link> and acknowledge the <Link to="/privacy" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Privacy Policy</Link>.
            </span>
          </div>

          {error && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: '0.82rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!acceptedTerms || !name.trim() || isSaving}
            className="btn btn-primary"
            style={{ borderRadius: 12, padding: '12px 20px', width: '100%', justifyContent: 'center' }}
          >
            {isSaving ? <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Finishing setup...</> : 'Continue to Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
