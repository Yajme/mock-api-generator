// services/schemaService.ts
import { connection } from "#src/config/database";
import { createSchemaValidationSchema } from "#src/schema/mockDataSchema";
import { InvalidDataError } from "#src/utils/";



interface ISchemaField {
  name: string;
  fakerType: string;
  options?: unknown;
}

interface ISchema {
  id?: string;
  name: string;
  is_preset: boolean;
  fields: ISchemaField[];
  owner_id: string | null;
}


const SCHEMA_FILTER_COLUMNS = {
  name: "name",
} as const;
/// returns rows 
export const getAllSchemas = async (
  userId: string,
  filter?: string,
  filterBy?: string,
): Promise<ISchema[]> => {
  let query = `SELECT id, name, is_preset, fields, owner_id
    FROM schemas
    WHERE owner_id = $1 OR is_preset = true
    `;
  const params: string[] = [userId];

  if (filterBy) {
    const filterColumn =
      SCHEMA_FILTER_COLUMNS[filterBy as keyof typeof SCHEMA_FILTER_COLUMNS];

    if (!filterColumn) {
      throw new InvalidDataError(`Invalid filterBy value: ${filterBy}`);
    }

    if (!filter) {
      throw new InvalidDataError(
        "Filter value is required when filterBy is set",
      );
    }

    params.push(filter);
    query += ` AND ${filterColumn} LIKE '%' || $2 || '%'`;
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

  const validationResult = createSchemaValidationSchema.safeParse({
    name,
    is_preset,
    fields,
    owner_id,
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

  const { rows } = await connection.query(
    `INSERT INTO schemas (name, is_preset, fields, owner_id)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, name, is_preset, fields, owner_id`,
    [name, is_preset, JSON.stringify(fields), owner_id],
  );

  return rows[0];
};
