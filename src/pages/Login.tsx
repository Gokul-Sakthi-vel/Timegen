import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, sendEmailOtp, verifyEmailOtp, updatePassword, completeOnboarding, user, isAuthenticated } = useApp();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Signup state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // UI state
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (signupEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      errors.email = 'Please enter a valid email address';
    }
    if (confirmPassword && signupPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    const rules = {
      length: signupPassword.length >= 8,
      upper: /[A-Z]/.test(signupPassword),
      number: /[0-9]/.test(signupPassword),
      special: /[^A-Za-z0-9]/.test(signupPassword)
    };
    
    return { errors, rules };
  }, [confirmPassword, signupEmail, signupPassword]);

  const passwordStrength = useMemo(() => {
    if (!signupPassword) return { label: '', score: 0, color: 'transparent' };
    const { rules } = validation;
    const metCount = Object.values(rules).filter(Boolean).length;
    
    if (metCount <= 1) return { label: 'Weak', score: 25, color: '#ef4444' };
    if (metCount <= 3) return { label: 'Medium', score: 60, color: '#f59e0b' };
    return { label: 'Strong', score: 100, color: '#10b981' };
  }, [signupPassword, validation]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(validation.errors).length > 0) return;
    
    setError('');
    setIsSubmitting(true);
    try {
      await sendEmailOtp(signupEmail, 'signup', {
        name,
        full_name: name,
        onboarding_completed: false,
        is_new_user: true,
      });
      setOtpSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('This email is already registered. Try signing in.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!signupEmail) return;
    setError('');
    setIsSendingOtp(true);
    try {
      await sendEmailOtp(signupEmail, 'signup', {
        name,
        full_name: name,
        onboarding_completed: false,
        is_new_user: true,
      });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!signupEmail || !otp.trim()) return;
    setError('');
    setIsVerifyingOtp(true);
    try {
      await verifyEmailOtp(signupEmail, otp, 'signup');
      setOtpVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleFinishSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !otpVerified || !name.trim() || !signupPassword || signupPassword !== confirmPassword) return;
    setError('');
    setIsSubmitting(true);
    try {
      // Create account with auth service
      const response = await fetch('https://timegen-8zc7.onrender.com/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: name,
          full_name: name,
        })
      });
      if (!response.ok) throw new Error('Signup failed');
      
      // Auto login after signup
      await login(signupEmail, signupPassword);
      navigate(from === '/signup' || from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete account setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setOauthLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setOauthLoading(false);
    }
  };

  const resetSignupForm = () => {
    setName('');
    setSignupEmail('');
    setSignupPassword('');
    setConfirmPassword('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setAcceptedTerms(false);
    setError('');
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
            {isSignupMode ? 'Create Account' : 'Welcome back'} 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isSignupMode ? 'Build smart schedules in minutes' : 'Sign in to continue to Timetable AI'}
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
          <button
            type="button"
            onClick={() => {
              handleGoogle();
            }}
            disabled={oauthLoading || isSubmitting}
            className="btn btn-outline"
            style={{ 
              width: '100%', 
              padding: '10px 20px', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 12, 
              marginBottom: 16,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {oauthLoading ? (
               <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {oauthLoading ? 'Signing in...' : `Continue with Google`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-placeholder)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Login Form */}
          {!isSignupMode && !otpSent && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="field-label" style={{ margin: 0, fontSize: '0.7rem' }}>Password</label>
                  <Link to="/forgot-password" className="link-hover" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-placeholder)' }} />
                  <input
                    type={showPassword ? "text" : "password"} 
                    required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -4 }}>
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, 
                    border: `1.5px solid ${rememberMe ? 'var(--accent)' : 'var(--border)'}`,
                    background: rememberMe ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {rememberMe && <CheckCircle2 size={12} color="var(--bg)" />}
                </div>
                <span 
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Remember me for 30 days
                </span>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)',
                    }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, color: 'var(--danger-text)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting || oauthLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4, gap: 8 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight style={{ width: 16, height: 16 }} /></>
                )}
              </motion.button>
            </form>
          )}

          {/* Signup Form - Email & Password Entry */}
          {isSignupMode && !otpSent && (
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="text" required value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="field-input" style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Work Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="email" required value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="field-input" style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem' }}
                  />
                </div>
                {validation.errors.email && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--danger-text)', margin: '4px 0 0', fontWeight: 500 }}>
                    {validation.errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Create Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Create a password"
                    className="field-input"
                    style={{ paddingLeft: 38, paddingRight: 40, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-placeholder)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {signupPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Strength</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: passwordStrength.color }}>{passwordStrength.label}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="field-input"
                    style={{ paddingLeft: 38, paddingRight: 40, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem', borderColor: validation.errors.confirmPassword ? 'var(--danger-text)' : 'var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-placeholder)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validation.errors.confirmPassword && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--danger-text)', margin: '4px 0 0', fontWeight: 500 }}>
                    {validation.errors.confirmPassword}
                  </p>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <span>
                  I agree to the <Link to="/terms" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Privacy Policy</Link>.
                </span>
              </label>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)' }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, color: 'var(--danger-text)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={Object.keys(validation.errors).length > 0 || !acceptedTerms || isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4, justifyContent: 'center' }}
              >
                {isSubmitting ? <><Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Sending OTP...</> : <>Send OTP <ArrowRight style={{ width: 16, height: 16 }} /></>}
              </motion.button>
            </form>
          )}

          {/* OTP Verification Form */}
          {isSignupMode && otpSent && !otpVerified && (
            <form onSubmit={e => { e.preventDefault(); handleVerifyOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="text"
                    value={name}
                    disabled
                    className="field-input"
                    style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem', opacity: 0.75 }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Verified Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="email"
                    value={signupEmail}
                    disabled
                    className="field-input"
                    style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem', opacity: 0.75 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP"
                  className="field-input"
                  style={{ flex: 1, borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', letterSpacing: '0.08em' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  style={{ borderRadius: 10, whiteSpace: 'nowrap' }}
                >
                  {isSendingOtp ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)' }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, color: 'var(--danger-text)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!otp.trim() || isVerifyingOtp || otpVerified}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, justifyContent: 'center' }}
              >
                {isVerifyingOtp ? <><Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Verifying...</> : otpVerified ? <>Email Verified <ArrowRight style={{ width: 16, height: 16 }} /></> : <>Verify Email <ArrowRight style={{ width: 16, height: 16 }} /></>}
              </motion.button>
            </form>
          )}

          {/* Password Creation Form */}
          {isSignupMode && otpSent && otpVerified && (
            <form onSubmit={handleFinishSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="text"
                    value={name}
                    disabled
                    className="field-input"
                    style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem', opacity: 0.75 }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" style={{ marginBottom: 4, fontSize: '0.7rem' }}>Verified Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-placeholder)' }} />
                  <input
                    type="email"
                    value={signupEmail}
                    disabled
                    className="field-input"
                    style={{ paddingLeft: 38, borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: '0.9rem', opacity: 0.75 }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <span>
                  I agree to the <Link to="/terms" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Privacy Policy</Link>.
                </span>
              </label>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)' }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, color: 'var(--danger-text)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', margin: 0, fontWeight: 500 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!acceptedTerms || isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4, justifyContent: 'center' }}
              >
                {isSubmitting ? <><Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Creating...</> : <>Complete Sign Up <ArrowRight style={{ width: 16, height: 16 }} /></>}
              </motion.button>
            </form>
          )}

          {/* Toggle between login and signup */}
          {!otpSent && (
            <p style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '16px 0 0' }}>
              {isSignupMode ? (
                <>Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignupMode(false);
                      setError('');
                      resetSignupForm();
                    }}
                    className="link-hover"
                    style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignupMode(true);
                      setError('');
                    }}
                    className="link-hover"
                    style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Create Account
                  </button>
                </>
              )}
            </p>
          )}

          {otpSent && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setIsSignupMode(false);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setError('');
                  resetSignupForm();
                }}
                className="link-hover"
                style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.825rem' }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-placeholder)', marginTop: 16, lineHeight: 1.4 }}>
          By continuing, you agree to our <Link to="/terms" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none' }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.<br/>
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
          text-decoration: underline !important;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
