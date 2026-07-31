import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/channelController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Phase 2 Google OAuth routes
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);

export default router;
