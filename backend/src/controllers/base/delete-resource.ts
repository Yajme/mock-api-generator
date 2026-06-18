// Base line controller for creating resource POST ONLY

import { Request, Response, NextFunction } from "express";
import { validateFields } from "#src/utils/validateFields";
import type { ZodObject } from "zod";
import { HttpStatus } from "#src/utils/httpStatus";

export const deleteResource =
  (
    schema: ZodObject,
    service: any,
    dtoBuilder: any,
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = dtoBuilder(req);
      validateFields(schema, data);
      await service(data);

      res.locals.status = HttpStatus.NO_CONTENT;

      next();
    } catch (error) {
      next(error);
    }
  };
