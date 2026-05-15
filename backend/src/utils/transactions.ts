// utils/transaction.ts
import { Pool, PoolClient } from 'pg';

export const withTransaction = async <T>(
  pool: Pool, 
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()   // always release back to pool
  }
}
