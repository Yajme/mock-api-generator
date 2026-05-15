// services/schemaService.ts
import { connection } from "#src/config/database";
import { InvalidDataError } from "#src/utils/";
import { isExistingFakerType } from "#src/utils/fakerTypes";

import * as z from "zod";

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

const schemaFieldValidationSchema = z.object({
  name: z.string().trim().min(1, "Field name is required"),
  fakerType: z
    .string()
    .trim()
    .min(1, "fakerType is required")
    .refine((fakerType) => isExistingFakerType(fakerType), {
      message: "Invalid fakerType",
    }),
  options: z.unknown().optional(),
});

const createSchemaValidationSchema = z
  .object({
    name: z.string().trim().min(1, "Schema name is required"),
    is_preset: z.boolean(),
    fields: z
      .array(schemaFieldValidationSchema)
      .min(1, "At least one schemaSchema Validation field is required"),
    owner_id: z.uuidv4().nullable(),
  })
  .superRefine(({ is_preset, owner_id }, context) => {
    if (is_preset && owner_id !== null) {
      context.addIssue({
        code: "custom",
        path: ["owner_id"],
        message: "Preset schemas must not include owner_id",
      });
    }

    if (!is_preset && owner_id === null) {
      context.addIssue({
        code: "custom",
        path: ["owner_id"],
        message: "Non-preset schemas must include owner_id",
      });
    }
  });

const SCHEMA_FILTER_COLUMNS = {
  name: "name",
} as const;

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
  console.log("owner_id: ", owner_id);
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
