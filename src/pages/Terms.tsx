import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text-primary)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Link to="/login" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          color: 'var(--text-secondary)', 
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: 32,
          transition: 'color 0.2s'
        }} className="hover-link">
          <ArrowLeft size={16} /> Back to App
        </Link>

        <header style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="logo-badge" style={{ width: 40, height: 40, borderRadius: 10 }}>
              <FileText style={{ width: 20, height: 20 }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Last updated: April 13, 2026</p>
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
                1. Use of Service
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Timegen is a timetable generation and management tool. By using this application, you agree to use it only for lawful and educational purposes. Any misuse of the service may result in termination of access.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                2. User Data
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You are solely responsible for the data you create within the platform, including subjects, faculty details, and schedules. While we provide tools for organization, we do not take responsibility for incorrect or incomplete data entered by users.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                3. Account Responsibility
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You are responsible for maintaining the security of your account and login credentials. Any activity performed under your account is your responsibility.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                4. Service Availability
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We strive to keep the service running smoothly with maximum uptime, but we do not guarantee uninterrupted access. Scheduled maintenance or unforeseen technical issues may occur.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                5. Limitation of Liability
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Timegen is provided "as is" without any warranties. We are not liable for any data loss, scheduling conflicts, or damages resulting from the use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                6. Changes to Terms
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We may update these terms at any time. We will notify users of significant changes, but continued use of the app after updates implies acceptance of the new terms.
              </p>
            </section>
          </div>
        </motion.div>

        <footer style={{ marginTop: 48, textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '0.875rem' }}>
          <p>© 2026 Timetable AI. All rights reserved.</p>
        </footer>
      </div>

      <style>{`
        .hover-link:hover {
          color: var(--accent) !important;
        }
        section h2 {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
