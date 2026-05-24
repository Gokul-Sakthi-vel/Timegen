import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Privacy() {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useApp();

  const handleBackToApp = () => {
    navigate(authLoading || isAuthenticated ? '/' : '/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text-primary)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <button onClick={handleBackToApp} style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          color: 'var(--text-secondary)', 
          background: 'none',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: 32,
          cursor: 'pointer',
          transition: 'color 0.2s'
        }} className="hover-link">
          <ArrowLeft size={16} /> Back to App
        </button>

        <header style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="logo-badge" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--success-bg)', color: 'var(--success-text)' }}>
              <Shield style={{ width: 20, height: 20 }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Safety</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Your privacy is our priority. Last updated: April 13, 2026</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 24,
            padding: '40px',
            boxShadow: 'var(--shadow-modal)',
            lineHeight: 1.6
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                1. Data We Collect
              </h2>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
                  <span><strong>Identification:</strong> Name and email address for authentication and communication.</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
                  <span><strong>Academic Data:</strong> Subjects, faculty, classes, and generated timetables.</span>
                </div>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                2. How We Use Data
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We use your data to provide core timetable generation features, improve user experience through analytics, and maintain the security of your account.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                3. Data Storage
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your data is stored securely using industry-standard backend services (Supabase/PostgreSQL). We implement strong encryption and access controls.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                4. Data Sharing
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We respect your privacy. We do not sell, trade, or share your personal data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                5. Authentication
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We use third-party authentication services like Google Login. Please note that their respective privacy policies also apply to the data shared during that process.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                6. Your Rights
              </h2>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p>You have full control over your data. You can:</p>
                <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Edit or delete your academic data at any time</li>
                  <li>Request permanent account deletion</li>
                  <li>Export your data for personal use</li>
                </ul>
              </div>
            </section>

            <section style={{ 
              marginTop: 16, 
              padding: '24px', 
              background: 'var(--surface-2)', 
              borderRadius: 16, 
              border: '1px solid var(--border)' 
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>7. Contact</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                For any privacy concerns or data requests, please contact us at:<br />
                <a href="mailto:support@timegen.app" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>support@timegen.app</a>
              </p>
            </section>
          </div>
        </motion.div>

        <footer style={{ marginTop: 48, textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '0.875rem' }}>
          <p>© 2026 Timetable AI. Secure. Private. Smart.</p>
        </footer>
      </div>

      <style>{`
        .hover-link:hover {
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
}
