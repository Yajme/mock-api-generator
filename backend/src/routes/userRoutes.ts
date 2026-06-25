import { Router, Request, Response, NextFunction } from 'express';
import * as mockController from '#src/controllers/mockController.js';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  res.locals.message = 'HELLO WORLD';
  next();
});

// Public mock read: /mock/:username/:version/:endpoint
router.get('/:username/:version/:endpoint', mockController.userEndpoint);

export default router;
