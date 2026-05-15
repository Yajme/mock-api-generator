import { Request, Response, NextFunction } from "express";
import { NotFoundError, UserError } from "../utils";

export const validateUsername = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username } = req.params;
    // Validate using zod
  } catch (error) {
    next(error);
  }
};

export const validateUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user_id } = req.params;
    // Implementation pending
  } catch (error) {
    next(error);
  }
};
