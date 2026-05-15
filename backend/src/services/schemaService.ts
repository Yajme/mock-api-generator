// services/schemaService.ts
import { connection } from "#src/config/database";
import { createSchemaValidationSchema } from "#src/schema/mockDataSchema";
import { InvalidDataError } from "#src/utils/";
import { ISchema } from "#src/types";



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
}: ISchema): Promise<ISchema> => {


  const { rows } = await connection.query(
    `INSERT INTO schemas (name, is_preset, fields, owner_id)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, name, is_preset, fields, owner_id`,
    [name, is_preset, JSON.stringify(fields), owner_id],
  );

  return rows[0];
};
