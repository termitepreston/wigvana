import { z } from "zod";

export const registerUserDtoSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

export const loginUserDtoSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenDtoSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required in cookies"),
  }),
});

// Add DTOs for password reset request and confirm later
