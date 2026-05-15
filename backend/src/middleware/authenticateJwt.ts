import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, AuthError } from '../utils/index.js';
interface AuthUser {
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthError('Missing token');
    }

    const token = header.split(' ')[1];
    const payload = verifyToken(token);
    
    // Ensure payload is an object (JwtPayload), not a string
    if (typeof payload === 'string') {
      throw new AuthError('Invalid token payload');
    }
    
    req.user = payload as AuthUser;
    next();
  } 
  catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
       return next(new AuthError("Token expired"));
     }
     if (error instanceof jwt.JsonWebTokenError ) {
       return next(new AuthError("Invalid token"));
     }
     return next(error);
  }
};
