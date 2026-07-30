import React from 'react';
import styles from './Dashboard.module.css';

export const Reports: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <h2>Historical Reports (Phase 2 Feature)</h2>
      <p>
        Detailed historical trend analysis and period comparisons require Google OAuth 2.0 consent with YouTube Analytics API access.
        This route is scaffolded and will be unlocked in Phase 2.
      </p>
    </div>
  );
};
