import express from "express";
import { userController } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  updateUserProfileSchema,
  changePasswordSchema,
} from "../dtos/user.dto.js";
import { conversationController } from "../controllers/conversation.controller.js";
import { listConversationsQuerySchema } from "../dtos/conversation.dto.js";
import { sellerController } from "../controllers/seller.controller.js";
import { sellerApplicationSchema } from "../dtos/seller.dto.js";

const router = express.Router();

// All routes in this file are protected and pertain to the authenticated user ('/me')
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: User Profile (Me)
 *   description: Management of the currently authenticated user's profile.
 * components:
 *   securitySchemes:
 *     bearerAuth: # Already defined globally, but good to note it's used
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User Profile (Me)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse' # Defined in app.js
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */
router.get("/", userController.getMyProfile);

/**
 * @openapi
 * /me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [User Profile (Me)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileDto'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request (validation error).
 *       401:
 *         description: Unauthorized.
 */
router.patch(
  "/",
  validate(updateUserProfileSchema),
  userController.updateMyProfile,
);

/**
 * @openapi
 * /me/password:
 *   post:
 *     summary: Change current user's password
 *     tags: [User Profile (Me)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordDto'
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully."
 *       400:
 *         description: Bad request (e.g., incorrect current password, validation error).
 *       401:
 *         description: Unauthorized.
 */
router.post(
  "/password",
  validate(changePasswordSchema),
  userController.changeMyPassword,
);

/**
 * @openapi
 * /me:
 *   delete:
 *     summary: Delete current user's account
 *     tags: [User Profile (Me)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully."
 *       401:
 *         description: Unauthorized.
 */
router.delete("/", userController.deleteMyAccount);

/**
 * @openapi
 * /me/conversations:
 *   get:
 *     summary: List authenticated user's conversations
 *     tags: [User Profile (Me)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, archived] }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [last_message_at, unread_count], default: last_message_at }
 *     responses:
 *       200:
 *         description: A paginated list of the user's conversations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedConversations'
 *       401:
 *         description: Unauthorized.
 */
router.get(
  "/conversations",
  validate(listConversationsQuerySchema),
  conversationController.listMyConversations,
);

/**
 * @openapi
 * /me/seller-application:
 *   post:
 *     summary: Request to become a seller
 *     tags: [User Profile (Me), Seller Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerApplicationInput'
 *     responses:
 *       201:
 *         description: Seller application submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerApplicationResponse'
 *       400:
 *         description: Bad request (e.g., already a seller, pending application).
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Conflict (e.g., already has a pending application).
 */
router.post(
  "/seller-application",
  // authorize(['buyer']) // Or any authenticated user not yet a seller
  validate(sellerApplicationSchema),
  sellerController.applyToBeSeller,
);

export default router;
