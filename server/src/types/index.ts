export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error: any | null;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agency_staff';
  created_at?: string;
}

export interface Client {
  id: string;
  agency_user_id: string;
  name: string;
  created_at?: string;
}

export interface Channel {
  id: string;
  client_id: string;
  youtube_channel_id: string;
  handle: string | null;
  oauth_connected: boolean;
  added_at?: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  subscriber_count?: string;
  video_count?: string;
  view_count?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration?: string;
}

export interface DailySnapshot {
  date: string;
  views: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  watchTimeMinutes: number;
  source: 'data_api_v3' | 'analytics_api';
}

export interface ChannelStats {
  channel: Channel;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  subscribers: number;
  totalVideos: number;
  engagementRate: number;
  topVideos: VideoItem[];
  recentVideos: VideoItem[];
  historicalDaily?: DailySnapshot[];
  watchTimeMinutes?: number;
  comparePreviousPeriod?: {
    viewsChangePercent: number;
    likesChangePercent: number;
    commentsChangePercent: number;
    subscribersChangePercent: number;
  };
}
