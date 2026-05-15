// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: string | object | Buffer): string => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): string | jwt.JwtPayload => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, env.JWT_SECRET);
};
