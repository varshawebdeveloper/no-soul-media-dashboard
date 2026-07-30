import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VideoTable } from '../components/VideoTable';
import type { VideoItem } from '../types';
import styles from './Dashboard.module.css';

export const Videos: React.FC = () => {
  const { selectedChannel } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChannel) return;
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/channels/${selectedChannel.id}/stats`);
        if (res.data.success) {
          setVideos(res.data.data.recentVideos || []);
        }
      } catch (err) {
        console.error('Failed to fetch videos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [selectedChannel]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.channelTitle}>Video Catalog & Analytics</h1>
          <span className={styles.handle}>Current uploaded videos and performance totals</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading video items...</p>
        </div>
      ) : (
        <VideoTable videos={videos} />
      )}
    </div>
  );
};
