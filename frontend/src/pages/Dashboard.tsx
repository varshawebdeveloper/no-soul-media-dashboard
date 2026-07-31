import React, { useEffect, useState } from 'react';
import { Eye, ThumbsUp, MessageSquare, Users, Video, TrendingUp, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ChannelStats } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { VideoTable } from '../components/VideoTable';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const { selectedChannel } = useAuth();
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');

  const fetchStats = async () => {
    if (!selectedChannel) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/channels/${selectedChannel.id}/stats?days=${dateRange}`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load channel stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedChannel, dateRange]);

  const handleConnectOAuth = async () => {
    try {
      const res = await api.get(`/channels/oauth/url?channelId=${selectedChannel?.id}`);
      if (res.data.success && res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      alert('Failed to initiate Google OAuth consent flow');
    }
  };

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
        <p>Fetching YouTube Statistics...</p>
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

  const isOAuthConnected = stats?.channel?.oauth_connected || false;
  const historicalData = stats?.historicalDaily || [];

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

        {/* Phase 2 OAuth Banner & Date Filters */}
        <div className={styles.headerActions}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>DATE RANGE</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={styles.rangeSelect}
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 180 Days / 6 Months</option>
            </select>
          </div>

          {!isOAuthConnected ? (
            <button onClick={handleConnectOAuth} className={styles.connectOAuthBtn}>
              <Lock size={14} /> CONNECT GOOGLE OAUTH
            </button>
          ) : (
            <span className={styles.oauthConnectedBadge}>
              <CheckCircle size={14} /> OAUTH LINKED
            </span>
          )}
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

      {/* Phase 2: Real Historical Daily Analytics Charts (Unlocked via OAuth) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Historical Analytics (YouTube Analytics API)</h2>
          {!isOAuthConnected && (
            <span className={styles.lockHint}>
              Connect Google OAuth to unlock real day-by-day views, likes, comments, and watch time charts.
            </span>
          )}
        </div>

        {isOAuthConnected && historicalData.length > 0 ? (
          <div className={styles.chartsGrid}>
            <TimeSeriesChart
              title="Daily Views"
              data={historicalData.map((d) => ({ date: d.date, value: d.views }))}
              color="#F2C230"
            />
            <TimeSeriesChart
              title="Daily Likes"
              data={historicalData.map((d) => ({ date: d.date, value: d.likes }))}
              color="#E8232D"
            />
            <TimeSeriesChart
              title="Daily Comments"
              data={historicalData.map((d) => ({ date: d.date, value: d.comments }))}
              color="#3B82F6"
            />
            <TimeSeriesChart
              title="Subscriber Growth"
              data={historicalData.map((d) => ({ date: d.date, value: d.subscribersGained }))}
              color="#10B981"
            />
          </div>
        ) : (
          <div className={styles.oauthPlaceholderCard}>
            <Lock size={32} className={styles.lockIcon} />
            <h3>Google OAuth Consent Required</h3>
            <p>
              Day-by-day historical breakdowns, subscriber growth, and watch time metrics require direct channel-owner authorization via the YouTube Analytics API.
            </p>
            <button onClick={handleConnectOAuth} className={styles.connectOAuthBtnLarge}>
              CONNECT CHANNEL VIA GOOGLE OAUTH 2.0
            </button>
          </div>
        )}
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
