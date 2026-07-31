import React from 'react';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

export const Reports: React.FC = () => {
  const { selectedChannel } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.channelTitle}>Historical Analytics Reports</h1>
          <span className={styles.handle}>Detailed performance breakdown & period comparison</span>
        </div>
      </div>

      {!selectedChannel ? (
        <div className={styles.emptyState}>
          <h2>No Channel Selected</h2>
          <p>Please select a channel from the sidebar to generate historical reports.</p>
        </div>
      ) : (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Channel Performance Trends</h2>
          <div className={styles.chartsGrid}>
            <TimeSeriesChart
              title="Views Performance"
              data={[
                { date: 'Day 1', value: 1200 },
                { date: 'Day 2', value: 1900 },
                { date: 'Day 3', value: 3000 },
                { date: 'Day 4', value: 2500 },
                { date: 'Day 5', value: 4200 },
              ]}
              color="#F2C230"
            />
            <TimeSeriesChart
              title="Engagement Trends"
              data={[
                { date: 'Day 1', value: 150 },
                { date: 'Day 2', value: 310 },
                { date: 'Day 3', value: 450 },
                { date: 'Day 4', value: 400 },
                { date: 'Day 5', value: 620 },
              ]}
              color="#E8232D"
            />
          </div>
        </div>
      )}
    </div>
  );
};
