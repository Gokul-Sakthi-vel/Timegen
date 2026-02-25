import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Mail, Lock, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../components/UI';
import { useApp } from '../context/AppContext';

// ── Google SVG icon ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);


// ── Setup notice component ───────────────────────────────────────────────────
const GoogleSetupNotice = () => (
  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
    <p className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      Google OAuth Setup Required
    </p>
    <p className="text-[10px] text-amber-500/80 leading-relaxed">
      Enable Google provider in your Supabase dashboard:
    </p>
    <ol className="text-[10px] text-amber-500/80 mt-1 space-y-0.5 list-decimal list-inside">
      <li>Go to Supabase → Authentication → Providers</li>
      <li>Enable Google &amp; add your Client ID / Secret</li>
      <li>Add callback: <span className="font-mono">…supabase.co/auth/v1/callback</span></li>
    </ol>
    <a
      href="https://supabase.com/docs/guides/auth/social-login/auth-google"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
    >
      View Setup Guide <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  // ── Email / Password sign in ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError('');
    setShowGoogleSetup(false);
    setOauthLoading('google');
    try {
      await loginWithGoogle();
      // Redirect happens automatically — no navigate needed
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      // Supabase throws "provider is not enabled" when Google OAuth isn't configured
      if (msg.toLowerCase().includes('provider') || msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('validation')) {
        setShowGoogleSetup(true);
      } else {
        setError(msg);
      }
      setOauthLoading(null);
    }
  };


  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-brand-500 rounded-2xl items-center justify-center shadow-2xl shadow-brand-500/30 mb-6">
            <Calendar className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-header tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-xs">Admin Portal</p>
        </div>

        <div className="bg-dark-surface rounded-3xl border border-dark-border shadow-2xl p-8 space-y-5">

          {/* ── Email / Password form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-slate-700 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <a href="#" className="text-[10px] font-bold text-brand-500 hover:text-brand-400 uppercase tracking-widest">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-slate-700 font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || oauthLoading !== null}
              className="w-full py-3 text-base shadow-2xl shadow-brand-500/30"
              icon={ArrowRight}
            >
              {isSubmitting ? 'Signing In…' : 'Sign In'}
            </Button>
          </form>

          {/* ── Sign up link ── */}
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-brand-500 hover:text-brand-400 transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {/* ── OAuth Buttons (bottom) ── */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={oauthLoading !== null || isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-dark-bg border border-dark-border hover:border-slate-500 hover:bg-white/5 transition-all font-semibold text-text-main text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {oauthLoading === 'google' ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            {/* Setup notice — shown only when Google provider isn't enabled */}
            {showGoogleSetup && <GoogleSetupNotice />}
          </div>

        </div>
      </div>
    </div>
  );
}
