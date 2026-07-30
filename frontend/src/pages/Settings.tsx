import React from 'react';
import styles from './Dashboard.module.css';

export const Settings: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <h2>Platform Settings (Phase 2 Feature)</h2>
      <p>
        OAuth application credentials, channel permissions, and agency staff RBAC controls will be configurable in Phase 2.
      </p>
    </div>
  );
};
