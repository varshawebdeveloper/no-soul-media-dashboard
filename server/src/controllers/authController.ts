import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../database/index.js';
import { config } from '../config/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'agency_staff']).optional().default('agency_staff'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// In-memory fallback user storage if PostgreSQL is not connected yet
const inMemoryUsers: any[] = [];

export async function register(req: Request, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, parseResult.error.format(), 'Validation failed', 400);
    }

    const { email, password, role } = parseResult.data;
    const passwordHash = await bcrypt.hash(password, 10);

    let newUser: any = null;

    try {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return sendError(res, 'User with this email already exists', 'Registration failed', 400);
      }

      const insertRes = await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
        [email, passwordHash, role]
      );
      newUser = insertRes.rows[0];
    } catch (dbErr) {
      // Fallback in-memory
      const exists = inMemoryUsers.find((u) => u.email === email);
      if (exists) {
        return sendError(res, 'User with this email already exists', 'Registration failed', 400);
      }
      newUser = {
        id: `user-${Date.now()}`,
        email,
        password_hash: passwordHash,
        role,
        created_at: new Date().toISOString(),
      };
      inMemoryUsers.push(newUser);
    }

    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, config.jwtAccessSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: newUser.id }, config.jwtRefreshSecret, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      {
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        accessToken,
      },
      'User registered successfully',
      201
    );
  } catch (err: any) {
    return sendError(res, err.message, 'Registration failed', 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, parseResult.error.format(), 'Validation failed', 400);
    }

    const { email, password } = parseResult.data;
    let user: any = null;

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbErr) {
      user = inMemoryUsers.find((u) => u.email === email);
    }

    if (!user) {
      return sendError(res, 'Invalid credentials', 'Authentication failed', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 'Authentication failed', 401);
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtAccessSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
      },
      'Logged in successfully'
    );
  } catch (err: any) {
    return sendError(res, err.message, 'Login failed', 500);
  }
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sendError(res, 'Refresh token missing', 'Unauthorized', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const accessToken = jwt.sign({ id: decoded.id }, config.jwtAccessSecret, { expiresIn: '15m' });
    return sendSuccess(res, { accessToken }, 'Token refreshed successfully');
  } catch (err) {
    return sendError(res, 'Invalid refresh token', 'Forbidden', 403);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, 'Logged out successfully');
}
