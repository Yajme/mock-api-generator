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
  generateMockData,
  InvalidDataError,
} from "../utils/index.js";
import * as endpointService from "../services/endpointService.js";
import { ICreateEndpointParams } from "#src/types/endpoint";
import {
  CreateSchema,
  createSchemaValidationSchema,
  DeleteSchema,
  deleteSchemaValidationSchema,
  UpdateSchema,
  updateSchemaValidationSchema,
} from "#src/schema/mockDataSchema";
import { DatabaseError } from "pg";
import {
  CreateEndpointBody,
  createEndpointSchema,
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
    id: req.params.id as string
  })
)

export const deleteUserSchema = deleteResource(
  deleteSchemaValidationSchema,
  deleteSchema,
  (req: Request): DeleteSchema => ({
    schema_id: req.params.id as string,
    owner_id: req.user?.sub
  })
)

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
    //validate fields here
    const endPointParam: CreateEndpointBody = {
      ownerId: userId,
      schemaId,
      name: endpoint,
      version,
      ttlSeconds: req.body.ttlSecond,
      count,
    };
    const validationResult = createEndpointSchema.safeParse(endPointParam);

    if (!validationResult.success) {
      const validationMessage = validationResult.error.issues
        .map(({ path, message }) => {
          const issuePath = path.length > 0 ? path.join(".") : "input";
          return `${issuePath}: ${message}`;
        })
        .join(", ");

      throw new InvalidDataError(validationMessage);
    }

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
    next();
  } catch (error) {
    next(error);
  }
};

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
