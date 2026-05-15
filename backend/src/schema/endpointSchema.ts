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

export const updateEndpointSchema = createEndpointSchema.partial(); // all fields optional

export type CreateEndpointBody = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointBody = z.infer<typeof updateEndpointSchema>;
export type UserGeneratedEndpoint = z.infer<typeof userEndpoint>;