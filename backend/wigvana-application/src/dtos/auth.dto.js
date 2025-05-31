import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterUserDto:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *           minLength: 1
 *         lastName:
 *           type: string
 *           example: "Doe"
 *           minLength: 1
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *           minLength: 6
 *
 *     LoginUserDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *
 *     UserResponse:
 *        type: object
 *        properties:
 *          _id:
 *            type: string
 *            format: uuid
 *          firstName:
 *            type: string
 *          lastName:
 *            type: string
 *          email:
 *            type: string
 *          roles:
 *            type: array
 *            items: { type: string }
 *          emailVerified:
 *            type: boolean
 *          emailVerificationToken:
 *            type: string
 *          emailVerificationTokenExpiresAt:
 *            type: string
 *            format: date
 *          passwordResetToken:
 *            type: string
 *          passwordResetTokenExpiresAt:
 *            type: string
 *            format: date
 *          phoneNumber:
 *            type: string
 *          profilePictureUrl:
 *            type: string
 *          accountStatus:
 *            type: array
 *            items: { type: string }
 *          lastLoginAt:
 *            type: string
 *            format: date
 *          preferredLocale:
 *            type: string
 *          preferredCurrency:
 *            type: string
 *
 *
 *     AuthResponse: # Common response for login/register
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserResponse' # Assumes UserResponse is defined globally
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     RefreshTokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     RequestPasswordResetDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *
 *     ConfirmPasswordResetDto:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: "The password reset token received by the user."
 *           example: "a1b2c3d4e5f6..."
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "newSecurePassword123"
 */

// Zod schema for user registration request body
export const registerUserDtoSchema = z.object({
	body: z.object({
		firstName: z.string().trim().min(1, "First name is required"),
		lastName: z.string().trim().min(1, "Last name is required"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters long"),
	}),
});

// Zod schema for user login request body
export const loginUserDtoSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
		password: z.string().min(1, "Password is required"), // Min 1 just to ensure it's not empty
	}),
});

// Zod schema for refresh token request (expects token in cookies)
export const refreshTokenDtoSchema = z.object({
	cookies: z.object({
		refreshToken: z.string().min(1, "Refresh token is required in cookies"),
	}),
});

// Zod schema for requesting a password reset
export const requestPasswordResetDtoSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address"),
	}),
});

// Zod schema for confirming a password reset
export const confirmPasswordResetDtoSchema = z.object({
	body: z.object({
		token: z.string().trim().min(1, "Password reset token is required"),
		newPassword: z
			.string()
			.min(6, "New password must be at least 6 characters long"),
	}),
});
