import { z } from "zod";
import { objectIdSchema } from "./common.dto.js"; // Assuming this has your UUID schema

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateUserProfileDto:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           example: "Jane"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           example: "Doe"
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: "+15551234567"
 *         profilePictureUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           example: "https://example.com/profile.jpg"
 *         preferredLocale:
 *           type: string
 *           example: "en-GB"
 *           nullable: true
 *         preferredCurrency:
 *           type: string
 *           example: "GBP"
 *           nullable: true
 *     ChangePasswordDto:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *
 *     # UserResponse is already defined globally in app.js for Swagger
 *     # We can re-declare it here for Zod if strict DTO-based responses are enforced by code
 *     # For now, we'll assume the service/controller shapes the response based on User model.
 */

export const updateUserProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1, "First name cannot be empty").optional(),
      lastName: z.string().min(1, "Last name cannot be empty").optional(),
      phoneNumber: z.string().trim().nullable().optional(), // Add more specific phone validation if needed
      profilePictureUrl: z
        .string()
        .url("Invalid URL for profile picture")
        .nullable()
        .optional(),
      preferredLocale: z.string().trim().min(2).nullable().optional(), // e.g., "en-US"
      preferredCurrency: z
        .string()
        .trim()
        .length(3)
        .toUpperCase()
        .nullable()
        .optional(), // e.g., "USD"
    })
    .strip(), // Remove any unspecified fields
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(6, "Current password must be at least 6 characters long"),
      newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters long"),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from the current password",
      path: ["newPassword"], // Path to the field that should display the error
    }),
});

// For admin user management, you'll need more comprehensive DTOs later
export const adminUpdateUserSchema = updateUserProfileSchema
  .deepPartial()
  .extend({
    // Example, expand later
    body: updateUserProfileSchema.shape.body
      .extend({
        roles: z.array(z.enum(["buyer", "seller", "admin"])).optional(),
        emailVerified: z.boolean().optional(),
        accountStatus: z
          .enum(["active", "suspended", "pending_verification", "deactivated"])
          .optional(),
      })
      .strip(),
  });

export const userIdParamsSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});
