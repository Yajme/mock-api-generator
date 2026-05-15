import { Request, Response, NextFunction } from 'express';
import { RegisterBody, LoginBody } from '../types/request.js';
import { loginUser, registerUser } from '../services/userService.js';
import { HttpStatus } from '../utils/httpStatus.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password } = req.body as RegisterBody;
    const user = { username, email, password };

    await registerUser(user);

    res.locals.message = 'User Registered';
    res.locals.status = HttpStatus.CREATED;
    next();
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginBody;

    const token = await loginUser(email, password);

    res.locals.data = { token };
    res.locals.message = 'User logged in';
    res.locals.status = HttpStatus.OK;
    next();
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // nothing to do server-side
    res.locals.data = null;
    res.locals.message = 'Logged out successfully';
    res.locals.status = HttpStatus.OK;
    next();
  } catch (error) {
    next(error);
  }
};
