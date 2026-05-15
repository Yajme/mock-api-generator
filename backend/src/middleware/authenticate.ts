import { Request, Response, NextFunction } from 'express';
import { UserError, HttpStatus } from '../utils/index';
import { authenticateKey } from '../services/authenticateService';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      permissions?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.headers['x-api-key'];
    if (!key || typeof key !== 'string') throw new UserError('Invalid API Key', HttpStatus.BAD_REQUEST);

    const response = await authenticateKey(key);
    if (!response.is_active) throw new UserError("API Key is inactive", HttpStatus.FORBIDDEN);

    req.userId = response.user_id;
    req.permissions = response.permissions;

    next();
  } catch (error) {
    next(error);
  }
};

export const authUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username;
    // Logic for authenticating username would go here.
    // For now, just passing through as it was empty in the original file.
    next();
  } catch (error) {
    next(error);
  }
};
