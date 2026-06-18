// src/schemas/userSchema.ts
import { z } from "zod";
export const signupSchema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8,"Passwords should be minimum of 8 characters"),
  first_name: z.string().min(1, "First should not be empty"),
  last_name: z.string().min(1, "Last name should not be empty")
})
export const updateProfileSchema = z
  .object({
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.username || data.email, {
    message: "At least one field must be provided",
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export type SignupDto = z.infer<typeof signupSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;
