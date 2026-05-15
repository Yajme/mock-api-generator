import { Request, Response, NextFunction, RequestHandler } from "express";
import { getAllSchemas, createSchema } from "../services/schemaService.js";
import {
  HttpStatus,
  NotFoundError,
  generateMockData,
  InvalidDataError,
} from "../utils/index.js";
import * as endpointService from "../services/endpointService.js";
import { ICreateEndpointParams } from "#src/types/endpoint";

type Params = {};
type ResBody = {};
type ReqBody = {};
type ReqQuery = {
  query: string;
  filter: string;
  filterBy: string;
};


export const getSchema: RequestHandler<
  Params,
  ResBody,
  ReqBody,
  ReqQuery
> = async (req, res, next) => {
  try {
    let userId = req.user?.id;
    const { filter, filterBy } = req.query;

    if (!userId) {
      throw new NotFoundError("User ID is required");
    }

    const schemas = await getAllSchemas(userId, filter, filterBy);

    res.locals.data = { schemas };
    res.locals.message = "Schema Successfully retrieved";
    next();
  } catch (error) {
    next(error);
  }
};

export const createUserSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fields: schema, schemaName, is_preset } = req.body;
    // fields is an array check if the fields is not an array
    const userId = req.user?.id;
    const userSchema = await createSchema({
      fields: schema,
      name: schemaName,
      owner_id: userId,
      is_preset: is_preset,
    });
    res.locals.status = HttpStatus.CREATED;
    res.locals.message = "Schema Created Successfully";
    res.locals.data = { userSchema };
    next();
  } catch (error) {
    next(error);
  }
};

// Testing purposes
export const generateMockdata = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id || "default";
    const schemas = await getAllSchemas(userId);
    const cachedData = generateMockData(schemas[0].fields, 10);
    res.locals.data = cachedData;
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const createEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { endpoint, schemaId, version, count } = req.body;
    const userId = req.user?.id;
    if (!endpoint) {
      throw new NotFoundError("Endpoint field must be filled");
    }

    const endPointParam: ICreateEndpointParams = {
      ownerId: userId,
      schemaId,
      name: endpoint,
      version,
      ttlSeconds: req.body.ttlSecond,
      count,
    };

    const userEndpoint =
      await endpointService.createUserEndpoint(endPointParam);

    res.locals.message = "Endpoint Successfully Created";
    res.locals.data = { userEndpoint };
    next();
  } catch (error) {
    next(error);
  }
};

export const userEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, version, endpoint } = req.params;

    res.locals.message = "Endpoint retrieved";
  } catch (error) {
    next(error);
  }
};
