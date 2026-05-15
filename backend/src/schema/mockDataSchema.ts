import { z } from "zod";
import { isExistingFakerType } from "#src/utils/fakerTypes";
export const schemaFieldValidationSchema = z.object({
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
