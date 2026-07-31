import { Router } from 'express';
import {
  getChannels,
  addChannel,
  getChannelById,
  getChannelStats,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../controllers/channelController.js';

const router = Router();

router.get('/oauth/url', getGoogleAuthUrl);
router.get('/oauth/callback', handleGoogleCallback);
router.get('/', getChannels);
router.post('/', addChannel);
router.get('/:id', getChannelById);
router.get('/:id/stats', getChannelStats);

export default router;
