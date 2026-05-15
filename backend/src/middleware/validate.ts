// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { HttpStatus } from "../utils/httpStatus.js";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // parse also strips unknown fields
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          status: HttpStatus.BAD_REQUEST,
          message: "Validation failed",
          data: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
};
