import React, { useEffect, useState } from 'react';
import { Eye, ThumbsUp, MessageSquare, Users, Video, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ChannelStats } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { VideoTable } from '../components/VideoTable';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const { selectedChannel } = useAuth();
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedChannel) return;
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/channels/${selectedChannel.id}/stats`);
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load channel stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedChannel]);

  if (!selectedChannel) {
    return (
      <div className={styles.emptyState}>
        <h2>No Channel Selected</h2>
        <p>Use the sidebar to add or select a YouTube Channel to view real-time stats.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Fetching YouTube Data API v3 live statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h3>Error Fetching Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div className={styles.channelMeta}>
          {stats?.channel.thumbnail_url && (
            <img src={stats.channel.thumbnail_url} alt="Channel Logo" className={styles.avatar} />
          )}
          <div>
            <h1 className={styles.channelTitle}>{stats?.channel.title || selectedChannel.youtube_channel_id}</h1>
            <span className={styles.handle}>{stats?.channel.handle || `@${selectedChannel.youtube_channel_id}`}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className={styles.grid}>
        <SummaryCard
          title="Total Views"
          value={stats?.totalViews || 0}
          subtitle="Lifetime views count"
          icon={<Eye size={20} />}
        />
        <SummaryCard
          title="Subscribers"
          value={stats?.subscribers || 0}
          subtitle="Public subscriber count"
          icon={<Users size={20} />}
        />
        <SummaryCard
          title="Total Likes"
          value={stats?.totalLikes || 0}
          subtitle="Sampled from recent uploads"
          icon={<ThumbsUp size={20} />}
        />
        <SummaryCard
          title="Total Comments"
          value={stats?.totalComments || 0}
          subtitle="Sampled from recent uploads"
          icon={<MessageSquare size={20} />}
        />
        <SummaryCard
          title="Total Videos"
          value={stats?.totalVideos || 0}
          subtitle="Public video uploads"
          icon={<Video size={20} />}
        />
        <SummaryCard
          title="Engagement Rate"
          value={`${stats?.engagementRate || 0}%`}
          subtitle="(Likes + Comments) / Views"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Top Videos Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Videos (By View Count)</h2>
        <div className={styles.topVideosGrid}>
          {stats?.topVideos.map((video) => (
            <div key={video.id} className={styles.topCard}>
              <img src={video.thumbnailUrl} alt={video.title} className={styles.topThumb} />
              <div className={styles.topContent}>
                <h4 className={styles.topTitle}>{video.title}</h4>
                <div className={styles.topStats}>
                  <span>{parseInt(video.viewCount, 10).toLocaleString()} views</span>
                  <span>•</span>
                  <span>{parseInt(video.likeCount, 10).toLocaleString()} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Analytics Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Video Analytics</h2>
        <VideoTable videos={stats?.recentVideos || []} />
      </div>
    </div>
  );
};
