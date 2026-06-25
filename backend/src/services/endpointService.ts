// services/endpointService.ts
import { connection, pool } from "#src/config/database";
import type { ISchemaField } from "#src/types";
import {
  generateMockData,
  withTransaction,
  NotFoundError,
} from "#src/utils/index";
import type {
  IDeleteEndpoint,
  IEndpoint,
  IUpdateEndpoint,
} from "#src/types/endpoint";
import { CreateEndpointBody, UserGeneratedEndpoint } from "#src/schema";

export const createUserEndpoint = async ({
  ownerId,
  schemaId,
  name,
  version,
  ttlSeconds,
  count,
}: CreateEndpointBody): Promise<IEndpoint> => {
  try {
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
          version,
          JSON.stringify(cachedData),
          ttlSeconds || 3600,
          expiry.toISOString(),
        ],
      );
      const endpoint: IEndpoint = rows[0];

      return endpoint;
    });
  } catch (error) {
    throw error;
  }
};

async function getOwnerIdByUsername(username: string): Promise<string> {
  const { rows } = await connection.query(
    `SELECT id FROM users WHERE username = $1 LIMIT 1`,
    [username],
  );
  if (rows.length < 1) throw new NotFoundError(`User '${username}' not found`);
  return rows[0].id;
}

export const userGeneratedEndpoint = async ({
  username,
  endpoint,
  version,
}: UserGeneratedEndpoint): Promise<{ cachedData: any[] }> => {
  const ownerId = await getOwnerIdByUsername(username);

  const { rows } = await connection.query(
    `SELECT cached_data
       FROM endpoints
      WHERE owner_id = $1 AND version = $2 AND name = $3
      LIMIT 1`,
    [ownerId, version, endpoint],
  );

  if (rows.length < 1) {
    throw new NotFoundError(
      `Endpoint '${endpoint}' (${version}) for user '${username}' not found`,
    );
  }

  return { cachedData: rows[0].cached_data };
};

export const listUserEndpoints = async (
  ownerId: string,
  filter?: string,
  filterBy?: string,
): Promise<IEndpoint[]> => {
  const params: unknown[] = [ownerId];
  let query = `
    SELECT id, owner_id, schema_id, name, version,
           visible_fields, ttl_seconds, ttl_expires_at,
           created_at, updated_at
      FROM endpoints
     WHERE owner_id = $1
  `;
  if (filterBy) {
    params.push(filter ?? "");
    query += ` AND ${filterBy} LIKE '%' || $2 || '%'`;
  }
  query += ` ORDER BY created_at DESC`;

  const { rows } = await connection.query(query, params);
  return rows as IEndpoint[];
};

export const updateUserEndpoint = async ({
  id,
  ownerId,
  name,
  version,
  schemaId,
  ttlSeconds,
  count,
}: IUpdateEndpoint): Promise<IEndpoint> => {
  return await withTransaction(pool, async (client) => {
    // 1. Fetch existing endpoint (ownership check + get current schema_id if needed)
    const { rows: existingRows } = await client.query(
      `SELECT schema_id, version, name FROM endpoints
        WHERE id = $1 AND owner_id = $2
        LIMIT 1`,
      [id, ownerId],
    );
    if (existingRows.length < 1) {
      throw new NotFoundError(`Endpoint ${id} not found`);
    }
    const current = existingRows[0];

    // 2. Decide if cached_data needs regeneration
    const schemaChanged =
      schemaId !== undefined && schemaId !== current.schema_id;
    const countChanged = count !== undefined;
    let newCachedData: any[] | null = null;

    if (schemaChanged || countChanged) {
      const effectiveSchemaId = schemaId ?? current.schema_id;
      const { rows: schemaRows } = await client.query(
        `SELECT fields FROM schemas WHERE id = $1`,
        [effectiveSchemaId],
      );
      if (schemaRows.length < 1) throw new NotFoundError("Schema not found");
      newCachedData = generateMockData(schemaRows[0].fields, count ?? 10);
    }

    // 3. Build dynamic UPDATE (only set fields that were provided)
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (name !== undefined) {
      sets.push(`name = $${i++}`);
      params.push(name);
    }
    if (version !== undefined) {
      sets.push(`version = $${i++}`);
      params.push(version);
    }
    if (schemaId !== undefined) {
      sets.push(`schema_id = $${i++}`);
      params.push(schemaId);
    }
    if (ttlSeconds !== undefined) {
      sets.push(`ttl_seconds = $${i++}`);
      params.push(ttlSeconds);
    }
    if (newCachedData !== null) {
      sets.push(`cached_data = $${i++}::jsonb`);
      params.push(JSON.stringify(newCachedData));
    }

    if (sets.length === 0) {
      // Nothing to update; return current row to keep idempotency
      const { rows } = await client.query(
        `SELECT * FROM endpoints WHERE id = $1 AND owner_id = $2`,
        [id, ownerId],
      );
      if (rows.length < 1) throw new NotFoundError(`Endpoint ${id} not found`);
      return rows[0];
    }

    params.push(id); // $(i)
    params.push(ownerId); // $(i+1)
    const { rows } = await client.query(
      `UPDATE endpoints
          SET ${sets.join(", ")}
        WHERE id = $${i++} AND owner_id = $${i++}
        RETURNING *`,
      params,
    );
    if (rows.length < 1) throw new NotFoundError(`Endpoint ${id} not found`);

    // 4. Snapshot sync — keep snapshot consistent with cached_data inside
    // the same transaction so the cron restore picks up the new data.
    if (newCachedData !== null) {
      await client.query(
        `UPDATE snapshots SET data = $1::jsonb WHERE endpoint_id = $2`,
        [JSON.stringify(newCachedData), id],
      );
    }

    return rows[0];
  });
};

export const deleteUserEndpoint = async ({
  id,
  ownerId,
}: IDeleteEndpoint): Promise<void> => {
  const { rowCount } = await connection.query(
    `DELETE FROM endpoints WHERE id = $1 AND owner_id = $2`,
    [id, ownerId],
  );
  if (!rowCount) throw new NotFoundError(`Endpoint ${id} not found`);
};
