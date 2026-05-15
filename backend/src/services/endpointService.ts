// services/endpointService.ts
import { connection, pool } from "../config/database";
import * as z from "zod";
import {
  generateMockData,
  withTransaction,
  NotFoundError,
  InvalidDataError,
} from "../utils/index";

interface ICreateEndpointParams {
  ownerId: string;
  schemaId: string;
  name: string;
  version: string;
  ttlSeconds: number;
  count?: number;
}

interface ISchemaField {
  name: string;
  fakerType: string;
  options?: any;
}

interface IEndpoint {
  id: string;
  owner_id: string;
  schema_id: string;
  name: string;
  version: string;
  cached_data: any;
  ttl_seconds: number;
  ttl_expires_at: string; // ISO date string
}
const createEndpointValidation = z.object({
  name: z.string().trim().min(1, "Endpoint Name is required"),
  version: z.string().trim(),
  ownerId: z.uuidv4(),
  schemaId: z.uuidv4(),
  ttlSeconds: z.number(),
  count: z.number(),
});
export const createUserEndpoint = async ({
  ownerId,
  schemaId,
  name,
  version,
  ttlSeconds,
  count,
}: ICreateEndpointParams): Promise<IEndpoint> => {
  //validate fields here
  const validationResult = createEndpointValidation.safeParse({
    ownerId,
    name,
    version,
    schemaId,
    ttlSeconds,
    count,
  });

  if (!validationResult.success) {
    const validationMessage = validationResult.error.issues
      .map(({ path, message }) => {
        const issuePath = path.length > 0 ? path.join(".") : "input";
        return `${issuePath}: ${message}`;
      })
      .join(", ");

    throw new InvalidDataError(validationMessage);
  }
  const { rows: schemaRows } = await connection.query(
    `SELECT fields FROM schemas WHERE id = $1`,
    [schemaId],
  );
  if (schemaRows.length < 1) throw new NotFoundError("Schema not found");

  const fields: ISchemaField[] = schemaRows[0].fields;

  const cachedData = generateMockData(fields, count || 10);
  const expiry = new Date(Date.now() + ttlSeconds * 1000);
  return await withTransaction(pool, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO endpoints
          (owner_id, schema_id, name, version, cached_data, ttl_seconds, ttl_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6,($7::timestamptz ))
       RETURNING *`,
      [
        ownerId,
        schemaId,
        name,
        `v${version}`,
        JSON.stringify(cachedData),
        ttlSeconds || 3600,
        expiry.toISOString(),
      ],
    );
    const endpoint: IEndpoint = rows[0];

    return endpoint;
  });
};

interface IUserEndpoint {
  username: string;
  endpoint: string;
  version: string;
}
export const userGeneratedEndpoint = async ({
  username,
  endpoint,
  version,
}: IUserEndpoint) => {
  try {
    //retrieve owner id  based on API KEY
    //select the api key first then the column of owner id
    //store it and use it as parameter to select the endpoint and its data from the table
    //SELECT ownerId FROM api_key WHERE username = $username huh there should be a join statement here wait a minute
    //so I think this is
    //SELECT user.userId FROM user JOIN api_key ON user.userId = api_key.ownerId WHERE user.username = $1 LIMIT 1
    //  SELECT users.id FROM users  JOIN api_keys ON users.id = api_keys.user_id WHERE users.username = 'johndoe' LIMIT 1
  } catch (error) {}
};
