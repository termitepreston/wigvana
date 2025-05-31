import express from "express";
import { conversationController } from "../controllers/conversation.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
	getConversationParamsSchema,
	sendMessageSchema,
	initiateConversationSchema, // For POST /
} from "../dtos/conversation.dto.js";

const router = express.Router();

// All routes in this file are protected as they involve user-specific data or actions
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: Conversations
 *   description: Managing conversations and messages.
 */

/**
 * @openapi
 * /conversations:
 *   post:
 *     summary: (Buyer) Initiate a new conversation or get an existing one
 *     tags: [Conversations, Buyer Actions] # Added Buyer Actions tag for clarity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateConversationInput'
 *     responses:
 *       200:
 *         description: Conversation retrieved or new message added to existing. Returns conversation details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationDetail'
 *       201: # Although service might return 200 always after finding/creating then adding message
 *         description: New conversation created and initial message sent. Returns conversation details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationDetail'
 *       400:
 *         description: Bad request (e.g., missing context, validation error).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a buyer or trying to message self).
 *       404:
 *         description: Context (product, order, or seller) not found.
 */
router.post(
	"/", // Corresponds to POST /api/v1/conversations
	authorize(["buyer"]), // Only buyers can initiate this way
	validate(initiateConversationSchema),
	conversationController.initiateConversation,
);

/**
 * @openapi
 * /conversations/{conversationId}:
 *   get:
 *     summary: Get details of a specific conversation (user must be a participant)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathConversationId'
 *     responses:
 *       200:
 *         description: Detailed information about the conversation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationDetail'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a participant).
 *       404:
 *         description: Conversation not found.
 */
router.get(
	"/:conversationId",
	validate(getConversationParamsSchema),
	conversationController.getConversationDetails,
);

/**
 * @openapi
 * /conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation (user must be a participant)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathConversationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessageInput'
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessageResponse'
 *       400:
 *         description: Bad request (validation error).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a participant).
 *       404:
 *         description: Conversation not found.
 */
router.post(
	"/:conversationId/messages",
	validate(sendMessageSchema),
	conversationController.sendMessage,
);

export default router;
