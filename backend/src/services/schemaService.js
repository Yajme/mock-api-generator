// services/schemaService.js
import {connection} from '../config/database.js';

export const getAllSchemas = async (userId) => {
  const { rows } = await connection.query(
    `SELECT id, name, is_preset, fields, owner_id
     FROM schemas
     WHERE owner_id = $1 OR is_preset = true
     ORDER BY is_preset DESC, name ASC`,
    [userId]
  )
  return rows
}
