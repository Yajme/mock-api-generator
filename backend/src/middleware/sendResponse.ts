import { Request, Response, NextFunction } from 'express';

interface ResponseLocals {
  status?: number;
  message?: string;
  data?: any;
}

export const sendResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!res.locals.data) {
      return next();
    }
    res.status(res.locals.status || 200).json({
      success: true,
      status: res.locals.status || 200,
      message: res.locals.message,
      data: res.locals.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
