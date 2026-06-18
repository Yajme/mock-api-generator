import { z } from "zod";
import { isExistingFakerType } from "#src/utils/fakerTypes";
const makeSchemaFieldValidationSchema = (
  isValidFakerType: (fakerType: string) => boolean,
) =>
  z.object({
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
const schemaFieldValidationSchema =
  makeSchemaFieldValidationSchema(isExistingFakerType);
// Update of schema validation
// on this one is_preset and owner id is not modifiable
export const updateSchemaValidationSchema = z.object({
  name: z.string().trim().min(1, "Schema name is required"),
  fields: z
    .array(schemaFieldValidationSchema)
    .min(1, "At least one schemaSchema Validation field is required"),
  id: z.uuidv4(),
});
export const createSchemaValidationSchema = z
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
export const deleteSchemaValidationSchema = z.object({
  schema_id: z.uuidv4().min(1, "Schema Id is required"),
  owner_id: z.uuidv4().optional(),
});

export type DeleteSchema = z.infer<typeof deleteSchemaValidationSchema>;
export type UpdateSchema = z.infer<typeof updateSchemaValidationSchema>;
export type CreateSchema = z.infer<typeof createSchemaValidationSchema>;
