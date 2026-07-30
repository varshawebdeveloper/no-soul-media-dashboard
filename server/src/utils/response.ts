import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(res: Response, data: T, message = '', statusCode = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, error: any, message = 'An error occurred', statusCode = 400) {
  let status = statusCode;
  let msg = message;
  let errObj = error;

  if (typeof error === 'string') {
    errObj = { message: error };
  }

  if (typeof message === 'number') {
    status = message;
    msg = 'An error occurred';
  }

  const payload: ApiResponse<null> = {
    success: false,
    message: msg,
    data: null,
    error: errObj,
  };
  return res.status(status).json(payload);
}
