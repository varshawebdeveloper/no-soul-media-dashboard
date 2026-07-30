import React from 'react';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>
      <div className={styles.valueContainer}>
        <span className={styles.value}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {trend && <div className={styles.trend}>{trend}</div>}
    </div>
  );
};
