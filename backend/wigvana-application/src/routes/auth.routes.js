import express from "express";
import { authController } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  registerUserDtoSchema,
  loginUserDtoSchema,
  refreshTokenDtoSchema,
} from "../dtos/auth.dto.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserDto'
 *     responses:
 *       201:
 *         description: User registered successfully. Returns user object and access token. Refresh token set in HTTP-only cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request (e.g., validation error, email already taken)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/register",
  validate(registerUserDtoSchema),
  authController.register,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserDto'
 *     responses:
 *       200:
 *         description: User logged in successfully. Returns user object and access token. Refresh token set in HTTP-only cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized (e.g., incorrect email/password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *          description: Forbidden (e.g., email not verified, account inactive)
 */
router.post("/login", validate(loginUserDtoSchema), authController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: [] # Indicates this endpoint might use an access token, though primarily relies on refresh token cookie
 *     responses:
 *       200:
 *         description: User logged out successfully. Clears refresh token cookie.
 *       401:
 *         description: Unauthorized if no valid session to logout.
 */
router.post("/logout", protect, authController.logout); // protect ensures req.user is available for logout service

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh an access token
 *     tags: [Authentication]
 *     description: Requires a valid refresh token sent as an HTTP-only cookie.
 *     responses:
 *       200:
 *         description: New access token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized (e.g., invalid or expired refresh token)
 */
router.post(
  "/refresh-token",
  validate(refreshTokenDtoSchema),
  authController.refreshTokens,
);

/**
 * @openapi
 * /auth/verify-email:
 *   get:
 *     summary: Verify user's email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The email verification token sent to the user.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully. You can now log in."
 *       400:
 *         description: Bad request (e.g., invalid or expired token).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/verify-email", authController.verifyEmail);

// TODO: Add routes for password reset request and confirm

export default router;
