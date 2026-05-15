import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpStatus } from "../utils";
interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  stack?: string;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (process.env.NODE_ENV === "DEVELOPMENT") {
    console.error(err.stack);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  if (err instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      status: HttpStatus.BAD_REQUEST,
      message: "Validation failed",
      data: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(status).json({
    error: message,
    success: false,
    timestamp : new Date().toISOString(),
    ...(process.env.NODE_ENV === "DEVELOPMENT" && { stack: err.stack }),
  });
};
