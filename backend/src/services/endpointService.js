// services/endpointService.js
import {connection} from '../config/database.js';

import { generateMockData,withTransaction,NotFoundError } from '../utils/index.js';


export const createEndpoint = async ({ ownerId, schemaId, name, version, ttlSeconds, count }) => {
  const { rows: schemaRows } = await connection.query(
    `SELECT fields FROM schemas WHERE id = $1`,
    [schemaId]
  )
  if (schemaRows.length < 1) throw new NotFoundError('Schema not found')

  const fields = schemaRows[0].fields

  const cachedData = generateMockData(fields, count || 10)

  return await withTransaction(pool, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO endpoints
         (owner_id, schema_id, name, version, cached_data, ttl_seconds, ttl_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($6 || ' seconds')::INTERVAL)
       RETURNING *`,
      [ownerId, schemaId, name, version, JSON.stringify(cachedData), ttlSeconds || 3600]
    )
    const endpoint = rows[0]

    await client.query(
      `INSERT INTO snapshots (endpoint_id, data)
       VALUES ($1, $2)`,
      [endpoint.id, JSON.stringify(cachedData)]
    )

    return endpoint
  })
}
