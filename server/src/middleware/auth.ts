import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access token required', 'Unauthorized', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired access token', 'Forbidden', 403);
  }
}
