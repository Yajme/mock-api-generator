// src/schemas/endpointSchema.ts
import { z } from "zod";

export const createEndpointSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9-_]+$/),
  schema_id: z.string().uuid(),
  version: z
    .string()
    .regex(/^v[0-9]+$/)
    .default("v1"),
  ttl_seconds: z.number().int().positive().default(3600),
  count: z.number().int().min(1).max(100).default(10),
});

export const updateEndpointSchema = createEndpointSchema.partial(); // all fields optional

export type CreateEndpointBody = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointBody = z.infer<typeof updateEndpointSchema>;
