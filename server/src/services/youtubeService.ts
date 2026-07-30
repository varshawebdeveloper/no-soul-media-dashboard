import axios from 'axios';
import { config } from '../config/index.js';
import { VideoItem } from '../types/index.js';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// In-memory cache for quota & performance
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.youtubeApiKey;
  }

  private getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    cache.set(key, { timestamp: Date.now(), data });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && error.response && error.response.status >= 500) {
        await new Promise((res) => setTimeout(res, 1000));
        return this.executeWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Resolves channel ID from handle (@handle), custom URL, or returns ID directly
   */
  async resolveChannelId(input: string): Promise<string> {
    let cleanInput = input.trim();
    if (cleanInput.startsWith('https://www.youtube.com/')) {
      cleanInput = cleanInput.replace('https://www.youtube.com/', '');
    }
    if (cleanInput.startsWith('youtube.com/')) {
      cleanInput = cleanInput.replace('youtube.com/', '');
    }
    if (cleanInput.startsWith('@')) {
      cleanInput = cleanInput.substring(1);
    }
    if (cleanInput.startsWith('c/') || cleanInput.startsWith('user/')) {
      cleanInput = cleanInput.split('/')[1];
    }
    if (cleanInput.startsWith('channel/')) {
      return cleanInput.replace('channel/', '');
    }

    // Direct Channel ID check (UC...)
    if (cleanInput.startsWith('UC') && cleanInput.length === 24) {
      return cleanInput;
    }

    const cacheKey = `resolve:${cleanInput}`;
    const cached = this.getCached<string>(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on the backend.');
    }

    return this.executeWithRetry(async () => {
      // Try by handle first
      try {
        const handleRes = await axios.get(`${YOUTUBE_BASE_URL}/channels`, {
          params: {
            part: 'id,snippet',
            forHandle: `@${cleanInput}`,
            key: this.apiKey,
          },
        });
        if (handleRes.data.items && handleRes.data.items.length > 0) {
          const id = handleRes.data.items[0].id;
          this.setCache(cacheKey, id);
          return id;
        }
      } catch (err) {
        // Fallback to search
      }

      // Fallback to search query
      const searchRes = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
        params: {
          part: 'id',
          type: 'channel',
          q: cleanInput,
          maxResults: 1,
          key: this.apiKey,
        },
      });

      if (searchRes.data.items && searchRes.data.items.length > 0) {
        const id = searchRes.data.items[0].id.channelId;
        this.setCache(cacheKey, id);
        return id;
      }

      throw new Error(`Could not find YouTube channel for input: ${input}`);
    });
  }

  /**
   * Fetch Channel Stats & Details (Data API v3)
   */
  async fetchChannelStats(channelId: string) {
    const cacheKey = `channelStats:${channelId}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on the backend.');
    }

    return this.executeWithRetry(async () => {
      const response = await axios.get(`${YOUTUBE_BASE_URL}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Channel not found for ID: ${channelId}`);
      }

      const item = response.data.items[0];
      const result = {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        handle: item.snippet.customUrl || null,
        thumbnailUrl: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.high?.url || '',
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || null,
        subscriberCount: item.statistics.hiddenSubscriberCount ? '0' : item.statistics.subscriberCount || '0',
        videoCount: item.statistics.videoCount || '0',
        viewCount: item.statistics.viewCount || '0',
      };

      this.setCache(cacheKey, result);
      return result;
    });
  }

  /**
   * Fetch Uploaded Videos (Data API v3) with Stats
   */
  async fetchUploads(uploadsPlaylistId: string, maxResults = 25): Promise<VideoItem[]> {
    const cacheKey = `uploads:${uploadsPlaylistId}:${maxResults}`;
    const cached = this.getCached<VideoItem[]>(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on the backend.');
    }

    return this.executeWithRetry(async () => {
      const playlistRes = await axios.get(`${YOUTUBE_BASE_URL}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults,
          key: this.apiKey,
        },
      });

      const videoIds = playlistRes.data.items
        .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) return [];

      const videos = await this.fetchVideoStats(videoIds);
      this.setCache(cacheKey, videos);
      return videos;
    });
  }

  /**
   * Fetch Video Statistics by Video IDs (Data API v3)
   */
  async fetchVideoStats(videoIds: string[]): Promise<VideoItem[]> {
    if (videoIds.length === 0) return [];
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on the backend.');
    }

    return this.executeWithRetry(async () => {
      const response = await axios.get(`${YOUTUBE_BASE_URL}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoIds.join(','),
          key: this.apiKey,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        viewCount: item.statistics.viewCount || '0',
        likeCount: item.statistics.likeCount || '0',
        commentCount: item.statistics.commentCount || '0',
        duration: item.contentDetails.duration,
      }));
    });
  }
}

export const youtubeService = new YouTubeService();
