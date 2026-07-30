import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { youtubeService } from '../services/youtubeService.js';
import { pool } from '../database/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ChannelStats } from '../types/index.js';

const inMemoryChannels: any[] = [];

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
    return sendError(res, err.message, 'Failed to fetch channels', 500);
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
          'INSERT INTO channels (youtube_channel_id, handle) VALUES ($1, $2) RETURNING *',
          [channelId, channelStats.handle]
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
    return sendError(res, err.message, 'Failed to fetch channel', 500);
  }
}

export async function getChannelStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let channelId = id;

    // Check if ID is UUID stored in DB
    try {
      const result = await pool.query('SELECT youtube_channel_id FROM channels WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        channelId = result.rows[0].youtube_channel_id;
      }
    } catch (dbErr) {
      const found = inMemoryChannels.find((c) => c.id === id);
      if (found) channelId = found.youtube_channel_id;
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

    // Compute Engagement Rate: ((Total Likes + Total Comments) / Total Views) * 100
    const engagementRate = totalViews > 0 ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(2)) : 0;

    // Sort top videos by view count
    const topVideos = [...uploads].sort((a, b) => parseInt(b.viewCount, 10) - parseInt(a.viewCount, 10)).slice(0, 5);

    const statsPayload: ChannelStats = {
      channel: {
        id: String(id),
        client_id: '',
        youtube_channel_id: channelId,
        handle: channelDetails.handle,
        oauth_connected: false,
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
    };

    return sendSuccess(res, statsPayload, 'Channel stats fetched successfully');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Failed to fetch channel stats', 500);
  }
}
