import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getAllSchemas,
  createSchema,
  updateSchema,
  deleteSchema,
} from "../services/schemaService.js";
import {
  HttpStatus,
  NotFoundError,
  UserError,
  generateMockData,
  InvalidDataError,
} from "../utils/index.js";
import {
  userGeneratedEndpoint,
  listUserEndpoints as listUserEndpointsService,
  updateUserEndpoint as updateUserEndpointService,
  deleteUserEndpoint as deleteUserEndpointService,
  createUserEndpoint,
} from "../services/endpointService.js";
import {
  ICreateEndpointParams,
  IDeleteEndpoint,
  IUpdateEndpoint,
} from "#src/types/endpoint";
import {
  CreateSchema,
  createSchemaValidationSchema,
  DeleteSchema,
  deleteSchemaValidationSchema,
  UpdateSchema,
  updateSchemaValidationSchema,
} from "#src/schema/mockDataSchema";
import { DatabaseError } from "pg";
import { ZodError } from "zod";
import {
  CreateEndpointBody,
  UpdateEndpointBody,
  createEndpointSchema,
  deleteEndpointSchema,
  listEndpointsQuerySchema,
  updateEndpointSchema,
  userEndpoint as userEndpointSchema,
} from "#src/schema/endpointSchema";
import { createResource } from "./base/create-resource.js";
import { updateResource } from "./base/update-resource.js";
import { deleteResource } from "./base/delete-resource.js";

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
  const SCHEMA_FILTER_COLUMNS = {
    name: "name",
  } as const;
  try {
    let userId = req.user?.sub;
    let { filter, filterBy } = req.query;

    if (!userId) {
      throw new NotFoundError("User ID is required");
    }
    //Zod validation should exist here
    const hasFilter = "filter" in req.query;
    const hasFilterBy = "filterBy" in req.query;

    if (!hasFilter && !hasFilterBy) {
      // no query params: allowed
    } else {
      if (!hasFilter || !hasFilterBy) {
        throw new InvalidDataError(
          "filter and filterBy must be provided together",
        );
      }

      const filter = String(req.query.filter).trim();
      const filterBy = String(req.query.filterBy).trim();

      if (!filter) throw new InvalidDataError("Filter value is required");
      if (!(filterBy in SCHEMA_FILTER_COLUMNS)) {
        throw new InvalidDataError(`Invalid filterBy value: ${filterBy}`);
      }
    }

    const schemas = await getAllSchemas(userId, filter, filterBy);
    if (schemas.length == 0) {
      throw new NotFoundError(`No schema found`);
    }
    res.locals.data = { schemas };
    res.locals.message = "Schema Successfully retrieved";
    next();
  } catch (error) {
    next(error);
  }
};
export const createUserSchema = createResource(
  createSchemaValidationSchema,
  createSchema,
  "Successfully Create User Schema",
  (req: Request): CreateSchema => ({
    fields: req.body.fields,
    name: req.body.schemaName,
    owner_id: req.user?.sub,
    is_preset: req.body.is_preset,
  }),
);
export const updateUserSchema = updateResource(
  updateSchemaValidationSchema,
  updateSchema,
  "Successfully Updated User Schema",
  (req: Request): UpdateSchema => ({
    name: req.body.name,
    fields: req.body.fields,
    id: req.params.id as string,
  }),
);

export const deleteUserSchema = deleteResource(
  deleteSchemaValidationSchema,
  deleteSchema,
  (req: Request): DeleteSchema => ({
    schema_id: req.params.id as string,
    owner_id: req.user?.sub,
  }),
);
export const userEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const params = userEndpointSchema.parse(req.params);
    const { cachedData } = await userGeneratedEndpoint(params);
    res.locals.status = HttpStatus.OK;
    res.locals.message = "Endpoint retrieved";
    res.locals.data = { cachedData };
    next();
  } catch (error) {
    next(error);
  }
};

export const listUserEndpoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      throw new NotFoundError("User ID is required");
    }

    const query = listEndpointsQuerySchema.parse(req.query);

    const endpoints = await listUserEndpointsService(
      userId,
      query.filter,
      query.filterBy,
    );
    res.locals.status = HttpStatus.OK;
    res.locals.message = "Endpoints retrieved";
    res.locals.data = { endpoints };
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new InvalidDataError(
          error.issues
            .map(
              ({ path, message }) => `${path.join(".") || "input"}: ${message}`,
            )
            .join(", "),
        ),
      );
    }
    next(error);
  }
};

export const updateUserEndpoint = updateResource(
  updateEndpointSchema,
  updateUserEndpointService,
  "Successfully Updated Endpoint",
  (req: Request): UpdateEndpointBody => ({
    id: req.params.id as string,
    ownerId: req.user?.sub as string,
    name: req.body.name,
    schemaId: req.body.schema_id,
    version: req.body.version,
    count: req.body.count,
    ttlSeconds: req.body.ttl_seconds,
  }),
);
// Wraps `updateResource` so that pg unique-violation errors are translated
// into a 409 instead of bubbling as a generic 500.

export const deleteUserEndpoint = deleteResource(
  deleteEndpointSchema,
  deleteUserEndpointService,
  (req: Request): IDeleteEndpoint => ({
    id: req.params.id as string,
    ownerId: req.user?.sub as string,
  }),
);

export const createEndpoint = createResource(
  createEndpointSchema,
  createUserEndpoint,
  "Successfully Created Endpoint for User",
  (req: Request): CreateEndpointBody => ({
    name: req.body.endpoint,
    ownerId: req.user?.sub,
    schemaId: req.body.schema_id,
    version: req.body.version,
    count: req.body.count,
    ttlSeconds: req.body.ttl_seconds,
  }),
);

// Testing purposes
// export const generateMockdata = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id || "default";
//     const schemas = await getAllSchemas(userId);
//     const cachedData = generateMockData(schemas[0].fields, 10);
//     res.locals.data = cachedData;
//     next();
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// };
