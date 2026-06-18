import { Request, Response, NextFunction } from 'express';
import { generateApiKey, registerApiKey } from '../services/authenticateService.js';
import { UserError, HttpStatus } from '../utils/index.js';

export const createKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // user id should come from JWT 
    const user_id = req.body.user_id || res.locals.user_id;
    // check if the user has proper permissions based on user id 
    const permissions = req.body.permissions || res.locals.permissions || '';
    const key = generateApiKey();

    if (!user_id || !permissions) {
      throw new UserError('Fields should not be empty', HttpStatus.BAD_REQUEST);
    }

    await registerApiKey({ key, user_id, permissions });
    res.locals.message = 'API Key created';
    res.locals.status = HttpStatus.CREATED;
    res.locals.data = { api_key: key };
    next();
  } catch (error) {
    next(error);
  }
};



export const listKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation pending
    res.locals.message = 'List of API Keys';
    res.locals.status = HttpStatus.OK;
    res.locals.data = []; // Placeholder for actual API keys data
    next();
  } catch (error) {
    next(error);
  }
};

export const deleteKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation pending
    res.locals.message = 'API Key deleted';
    res.locals.status = HttpStatus.OK;
    res.locals.data = null;
    next();
  } catch (error) {
    next(error);
  }
};
