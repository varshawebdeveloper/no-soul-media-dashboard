import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { youtubeService } from '../services/youtubeService.js';
import { pool } from '../database/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ChannelStats, DailySnapshot } from '../types/index.js';

const inMemoryChannels: any[] = [];
const oAuthTokensMap = new Map<string, any>();

export async function getChannels(req: AuthRequest, res: Response) {
  try {
    let channels: any[] = [];

    try {
      const result = await pool.query('SELECT * FROM channels ORDER BY added_at DESC');
      channels = result.rows;
    } catch (dbErr) {
      channels = inMemoryChannels;
    }

    return sendSuccess(res, channels, 'Channels fetched successfully');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to fetch channels', 500);
  }
}

export async function addChannel(req: AuthRequest, res: Response) {
  try {
    const { input } = req.body;
    if (!input) {
      return sendError(res, 'Channel URL, handle, or ID is required', 'Validation failed', 400);
    }

    const channelId = await youtubeService.resolveChannelId(input);
    const channelStats = await youtubeService.fetchChannelStats(channelId);

    let savedChannel: any = null;

    try {
      const checkRes = await pool.query('SELECT * FROM channels WHERE youtube_channel_id = $1', [channelId]);
      if (checkRes.rows.length > 0) {
        savedChannel = checkRes.rows[0];
      } else {
        const insertRes = await pool.query(
          'INSERT INTO channels (youtube_channel_id, handle, oauth_connected) VALUES ($1, $2, $3) RETURNING *',
          [channelId, channelStats.handle, false]
        );
        savedChannel = insertRes.rows[0];
      }
    } catch (dbErr) {
      savedChannel = inMemoryChannels.find((c) => c.youtube_channel_id === channelId);
      if (!savedChannel) {
        savedChannel = {
          id: `channel-${Date.now()}`,
          youtube_channel_id: channelId,
          handle: channelStats.handle,
          oauth_connected: false,
          added_at: new Date().toISOString(),
        };
        inMemoryChannels.push(savedChannel);
      }
    }

    return sendSuccess(
      res,
      {
        channel: savedChannel,
        stats: channelStats,
      },
      'Channel added successfully',
      201
    );
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to add channel', 500);
  }
}

export async function getChannelById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let channel: any = null;

    try {
      const result = await pool.query('SELECT * FROM channels WHERE id = $1 OR youtube_channel_id = $1', [id]);
      if (result.rows.length > 0) {
        channel = result.rows[0];
      }
    } catch (dbErr) {
      channel = inMemoryChannels.find((c) => c.id === id || c.youtube_channel_id === id);
    }

    if (!channel) {
      return sendError(res, 'Channel not found', 'Not Found', 404);
    }

    const channelId = String(channel.youtube_channel_id || channel.id);
    const stats = await youtubeService.fetchChannelStats(channelId);

    return sendSuccess(res, { ...channel, details: stats }, 'Channel fetched successfully');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to fetch channel', 500);
  }
}

export async function getChannelStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { days = '30', startDate, endDate } = req.query;
    let channelId = id;
    let oauthConnected = false;

    // Check DB or memory for channel OAuth state
    try {
      const result = await pool.query('SELECT youtube_channel_id, oauth_connected FROM channels WHERE id = $1 OR youtube_channel_id = $1', [id]);
      if (result.rows.length > 0) {
        channelId = result.rows[0].youtube_channel_id;
        oauthConnected = result.rows[0].oauth_connected;
      }
    } catch (dbErr) {
      const found = inMemoryChannels.find((c) => c.id === id || c.youtube_channel_id === id);
      if (found) {
        channelId = found.youtube_channel_id;
        oauthConnected = found.oauth_connected;
      }
    }

    // Fetch live channel details
    const channelDetails = await youtubeService.fetchChannelStats(channelId);

    // Fetch videos from uploads playlist
    let uploads: any[] = [];
    if (channelDetails.uploadsPlaylistId) {
      uploads = await youtubeService.fetchUploads(channelDetails.uploadsPlaylistId, 30);
    }

    const totalViews = parseInt(channelDetails.viewCount, 10) || 0;
    const subscribers = parseInt(channelDetails.subscriberCount, 10) || 0;
    const totalVideos = parseInt(channelDetails.videoCount, 10) || 0;

    let totalLikes = 0;
    let totalComments = 0;

    uploads.forEach((v) => {
      totalLikes += parseInt(v.likeCount, 10) || 0;
      totalComments += parseInt(v.commentCount, 10) || 0;
    });

    const engagementRate = totalViews > 0 ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(2)) : 0;
    const topVideos = [...uploads].sort((a, b) => parseInt(b.viewCount, 10) - parseInt(a.viewCount, 10)).slice(0, 5);

    let historicalDaily: DailySnapshot[] = [];
    let watchTimeMinutes = 0;

    // Phase 2: If OAuth is linked and access token available, query YouTube Analytics API
    const storedTokens = oAuthTokensMap.get(channelId);
    if (storedTokens?.access_token) {
      try {
        let startStr = '';
        let endStr = new Date().toISOString().split('T')[0];

        if (startDate && endDate) {
          startStr = String(startDate);
          endStr = String(endDate);
        } else {
          const numDays = parseInt(String(days), 10) || 30;
          const d = new Date();
          d.setDate(d.getDate() - numDays);
          startStr = d.toISOString().split('T')[0];
        }

        historicalDaily = await youtubeService.fetchDailyAnalytics(storedTokens.access_token, channelId, startStr, endStr);
        watchTimeMinutes = historicalDaily.reduce((acc, curr) => acc + curr.watchTimeMinutes, 0);
        oauthConnected = true;
      } catch (analyticsErr) {
        console.warn('[YouTube Analytics API] Fetch failed or fallback:', (analyticsErr as Error).message);
      }
    }

    const statsPayload: ChannelStats = {
      channel: {
        id: String(id),
        client_id: '',
        youtube_channel_id: channelId,
        handle: channelDetails.handle,
        oauth_connected: oauthConnected,
        title: channelDetails.title,
        description: channelDetails.description,
        thumbnail_url: channelDetails.thumbnailUrl,
        subscriber_count: channelDetails.subscriberCount,
        video_count: channelDetails.videoCount,
        view_count: channelDetails.viewCount,
      },
      totalViews,
      totalLikes,
      totalComments,
      subscribers,
      totalVideos,
      engagementRate,
      topVideos,
      recentVideos: uploads,
      historicalDaily,
      watchTimeMinutes,
    };

    return sendSuccess(res, statsPayload, 'Channel stats fetched successfully');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to fetch channel stats', 500);
  }
}

/**
 * Phase 2: Google OAuth Authorization URL Endpoint
 */
export async function getGoogleAuthUrl(req: AuthRequest, res: Response) {
  try {
    const { channelId } = req.query;
    const url = youtubeService.getOAuthUrl(String(channelId || ''));
    return sendSuccess(res, { url }, 'Google OAuth URL generated');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to generate OAuth URL', 500);
  }
}

/**
 * Phase 2: Google OAuth Callback Handler
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return sendError(res, 'Authorization code missing', 'OAuth Error', 400);
    }

    const tokens = await youtubeService.getTokensFromCode(String(code));
    const channelId = String(state || '');

    if (channelId) {
      oAuthTokensMap.set(channelId, tokens);
      try {
        await pool.query('UPDATE channels SET oauth_connected = true WHERE youtube_channel_id = $1 OR id = $1', [channelId]);
      } catch (dbErr) {
        const found = inMemoryChannels.find((c) => c.id === channelId || c.youtube_channel_id === channelId);
        if (found) found.oauth_connected = true;
      }
    }

    // Redirect back to frontend dashboard
    return res.redirect('http://localhost:5173/?oauth=success');
  } catch (err: any) {
    console.error('[Google Callback Error]', err);
    return res.redirect('http://localhost:5173/?oauth=error');
  }
}
