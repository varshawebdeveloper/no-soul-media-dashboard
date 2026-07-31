import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

export const Settings: React.FC = () => {
  const { user, selectedChannel } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.channelTitle}>Platform Settings</h1>
          <span className={styles.handle}>Manage agency staff roles and OAuth credentials</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>User Credentials & Account</h2>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: 24, borderRadius: 'var(--radius-md)' }}>
          <p style={{ marginBottom: 12 }}><strong>Email:</strong> {user?.email}</p>
          <p style={{ marginBottom: 12 }}><strong>Role:</strong> <span style={{ color: 'var(--accent-yellow)', textTransform: 'uppercase', fontWeight: 700 }}>{user?.role}</span></p>
          <p><strong>Selected Channel ID:</strong> {selectedChannel?.youtube_channel_id || 'None'}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Security & Security Headers</h2>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: 24, borderRadius: 'var(--radius-md)' }}>
          <p style={{ marginBottom: 8, color: '#10B981', fontWeight: 700 }}>✔ Helmet Security Headers Enabled</p>
          <p style={{ marginBottom: 8, color: '#10B981', fontWeight: 700 }}>✔ Rate Limiting Active (200 requests / 15m)</p>
          <p style={{ color: '#10B981', fontWeight: 700 }}>✔ Strict CORS & httpOnly Cookies Enforced</p>
        </div>
      </div>
    </div>
  );
};
