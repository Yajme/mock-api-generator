import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ForbiddenError } from '../utils/AppError.js';

export const internalOnly = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const secret = req.headers['x-internal-secret'] as string;

    if (!secret || secret !== env.INTERNAL_SECRET) {
      throw new ForbiddenError('Access restricted');
    }

    next();
  } catch (error) {
    next(error);
  }
};
