import { Router } from 'express';
import { getChannels, addChannel, getChannelById, getChannelStats } from '../controllers/channelController.js';

const router = Router();

router.get('/', getChannels);
router.post('/', addChannel);
router.get('/:id', getChannelById);
router.get('/:id/stats', getChannelStats);

export default router;
