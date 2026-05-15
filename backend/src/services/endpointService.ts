// services/endpointService.ts
import { connection, pool } from "#src/config/database";
import type { ISchemaField } from "#src/types";
import {
  generateMockData,
  withTransaction,
  NotFoundError,
} from "#src/utils/index";
import type { IEndpoint  } from "#src/types/endpoint";
import { CreateEndpointBody, UserGeneratedEndpoint } from "#src/schema";



export const createUserEndpoint = async ({
  ownerId,
  schemaId,
  name,
  version,
  ttlSeconds,
  count,
}: CreateEndpointBody): Promise<IEndpoint> => {
  
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


export const userGeneratedEndpoint = async ({
  username,
  endpoint,
  version,
}: UserGeneratedEndpoint) => {
  
    //retrieve owner id  based on API KEY
    //select the api key first then the column of owner id
    //store it and use it as parameter to select the endpoint and its data from the table
    //SELECT ownerId FROM api_key WHERE username = $username huh there should be a join statement here wait a minute
    //so I think this is
    //SELECT user.userId FROM user JOIN api_key ON user.userId = api_key.ownerId WHERE user.username = $1 LIMIT 1
    //  SELECT users.id FROM users  JOIN api_keys ON users.id = api_keys.user_id WHERE users.username = 'johndoe' LIMIT 1
    
  
};
