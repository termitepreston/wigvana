// ... (existing imports and router setup)
import { authorize } from "../middlewares/auth.middleware.js"; // Add authorize
import { initiateConversationSchema } from "../dtos/conversation.dto.js"; // Add this

// ... (existing routes like GET /:conversationId, POST /:conversationId/messages)

/**
 * @openapi
 * /conversations:
 *   post:
 *     summary: (Buyer) Initiate a new conversation or get an existing one
 *     tags: [Conversations (General Access), Buyer Conversations]
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
 *         description: Conversation retrieved or new message added to existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationDetail' # Returns full detail
 *       201:
 *         description: New conversation created and initial message sent.
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
  "/", // This corresponds to POST /api/v1/conversations
  authorize(["buyer"]), // Only buyers can initiate this way
  validate(initiateConversationSchema),
  conversationController.initiateConversation,
);

export default router;
