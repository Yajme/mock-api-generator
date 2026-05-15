// src/schemas/authSchema.ts
import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(64),
});

export const changeEmailSchema = z.object({
  password: z.string().min(1),
  newEmail: z.string().email(),
});

// infer TypeScript types directly from Zod — no duplicate interface needed
export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type ChangeEmailBody = z.infer<typeof changeEmailSchema>;
