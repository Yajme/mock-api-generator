// Base line controller for creating resource POST ONLY

import { Request, Response, NextFunction } from "express";
import { validateFields } from "#src/utils/validateFields";
import type { ZodObject } from "zod";
import { HttpStatus } from "#src/utils/httpStatus";

export const updateResource =
  (
    schema: ZodObject,
    service: any,
    successMessage: string,
    dtoBuilder: any,
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = dtoBuilder(req);
      validateFields(schema, data);

      const result = await service(data);

      res.locals.status = HttpStatus.ACCEPTED;
      res.locals.message = successMessage;
      res.locals.data = { result };

      next();
    } catch (error) {
      next(error);
    }
  };
