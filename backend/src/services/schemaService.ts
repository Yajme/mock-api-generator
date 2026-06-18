// services/schemaService.ts
import { connection } from "#src/config/database";
import type {
  CreateSchema,
  DeleteSchema,
  UpdateSchema,
} from "#src/schema/mockDataSchema";
import type {
  ISchema,
} from "#src/types/Schema/Props"; 

/// returns rows
export const getAllSchemas = async (
  userId: string,
  filter?: string,
  filterBy?: string,
): Promise<ISchema[]> => {
  let query = `SELECT id, name, is_preset, fields, owner_id
    FROM schemas
    WHERE (owner_id = $1 OR is_preset = true)
    `;
  const params: string[] = [userId];

  if (filterBy) {
    params.push(filter?.trim() ?? "");
    query += ` AND ${filterBy} LIKE '%' || $2 || '%'`;
  }

  query += ` ORDER BY is_preset DESC, name ASC`;

  const { rows } = await connection.query(query, params);
  return rows;
};

export const createSchema = async ({
  name,
  is_preset,
  fields,
  owner_id,
}: CreateSchema): Promise<ISchema> => {
  const { rows } = await connection.query(
    `INSERT INTO schemas (name, is_preset, fields, owner_id)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, name, is_preset, fields, owner_id`,
    [name, is_preset ?? false, JSON.stringify(fields), owner_id],
  );

  return rows[0];
};

export const updateSchema = async ({
  id,
  name,
  fields,
}: UpdateSchema): Promise<ISchema> => {
  //update name, fields
  const query = "UPDATE schemas SET name = $1, fields = $2::jsonb WHERE id = $3 RETURNING id, name, is_preset, fields, owner_id";
  const { rows } = await connection.query(query, [name, JSON.stringify(fields), id]);

  return rows[0];
};

export const deleteSchema = async ({ schema_id, owner_id }: DeleteSchema) => {
  const forOwner = " AND owner_id = $2";
  let  query = "DELETE FROM schemas WHERE id = $1";
  let params = [schema_id];

  if(owner_id) {
    query += forOwner;
    params.push(owner_id);
  }
  const {rows} = await connection.query(query,params);

  return rows;
};
