import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import styles from '../components/SummaryCard.module.css';

interface TimeSeriesChartProps {
  data: { date: string; value: number }[];
  title: string;
  dataKey?: string;
  color?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  dataKey = 'value',
  color = '#F2C230',
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div>
      <div style={{ width: '100%', height: 220, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#A3A3A3" fontSize={11} />
            <YAxis stroke="#A3A3A3" fontSize={11} />
            <Tooltip
              contentStyle={{ background: '#141414', borderColor: '#2A2A2A', borderRadius: 8, color: '#FFF' }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#grad-${title})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
