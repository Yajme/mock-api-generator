// src/schemas/endpointSchema.ts
import { z } from "zod";
const NAME_PATTERN = /^[a-zA-Z0-9-_]+$/;
export const userEndpoint = z.object({
  username: z.string().min(1, "Username is required").regex(NAME_PATTERN),
  endpoint: z
    .string()
    .min(1, "Endpoint Name is required")
    .max(50)
    .regex(NAME_PATTERN),
  version: z
    .string()
    .regex(/^v[0-9]+$/)
    .default("v1"),
});
export const createEndpointSchema = z.object({
  name: z
    .string()
    .min(1, "Endpoint Name is required")
    .max(50)
    .regex(NAME_PATTERN),
  ownerId: z.uuidv4(),
  schemaId: z.uuidv4(),
  version: z
    .string()
    .regex(/^v[0-9]+$/)
    .default("v1"),
  ttlSeconds: z.number().int().positive().default(3600),
  count: z.number().int().min(1).max(100).default(10),
});

// Rebuild rather than use createEndpointSchema.partial() so we can
// add an `id` field (for the route param) and keep validation tight.
export const updateEndpointSchema = z.object({
  id: z.uuidv4({ message: "Valid endpoint id is required" }),
  ownerId: z.uuidv4({ message: "Valid owner id is required" }),
  name: z
    .string()
    .min(1, "Endpoint Name is required")
    .max(50)
    .regex(NAME_PATTERN)
    .optional(),
  schemaId: z.uuidv4().optional(),
  version: z
    .string()
    .regex(/^v[0-9]+$/)
    .optional(),
  ttlSeconds: z.number().int().positive().optional(),
  count: z.number().int().min(1).max(100).optional(),
});

export const deleteEndpointSchema = z.object({
  id: z.uuidv4({ message: "Valid endpoint id is required" }),
  ownerId: z.uuidv4({ message: "Valid owner id is required" }),
});

export const ENDPOINT_FILTER_COLUMNS = ["name", "version"] as const;

export const listEndpointsQuerySchema = z
  .object({
    filter: z.string().trim().optional(),
    filterBy: z.enum(ENDPOINT_FILTER_COLUMNS).optional(),
  })
  .superRefine((q, ctx) => {
    const hasFilter = q.filter !== undefined;
    const hasFilterBy = q.filterBy !== undefined;
    if (hasFilter !== hasFilterBy) {
      ctx.addIssue({
        code: "custom",
        path: ["filter"],
        message: "filter and filterBy must be provided together",
      });
    }
    if (hasFilter && q.filter!.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["filter"],
        message: "filter value cannot be empty",
      });
    }
  });

export type CreateEndpointBody = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointBody = z.infer<typeof updateEndpointSchema>;
export type DeleteEndpoint = z.infer<typeof deleteEndpointSchema>;
export type ListEndpointsQuery = z.infer<typeof listEndpointsQuerySchema>;
export type UserGeneratedEndpoint = z.infer<typeof userEndpoint>;