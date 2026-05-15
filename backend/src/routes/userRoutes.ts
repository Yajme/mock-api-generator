import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  res.locals.message = 'HELLO WORLD';
  next();
});
// router.get("/:username",);

export default router;
