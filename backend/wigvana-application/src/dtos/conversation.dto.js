import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     ChatMessageInput:
 *       type: object
 *       required:
 *         - messageText
 *       properties:
 *         messageText:
 *           type: string
 *           minLength: 1
 *           description: The content of the message.
 *         messageType:
 *           type: string
 *           enum: [text, image_url, product_link, order_link]
 *           default: text
 *           description: Type of the message.
 *     ChatMessageResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ChatMessageInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             conversationId:
 *               type: string
 *               format: uuid
 *             senderId:
 *               type: string
 *               format: uuid
 *             receiverId:
 *               type: string
 *               format: uuid
 *             sentAt:
 *               type: string
 *               format: "date-time"
 *             readAt:
 *               type: string
 *               format: "date-time"
 *               nullable: true
 *             createdAt:
 *               type: string
 *               format: "date-time"
 *     ConversationParticipant: # Simplified participant info for conversation list
 *        type: object
 *        properties:
 *          userId:
 *            type: string
 *            format: uuid
 *          name: # e.g., firstName + lastName, or storeName for seller
 *            type: string
 *          profilePictureUrl:
 *            type: string
 *            format: url
 *            nullable: true
 *     ConversationListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         otherParticipant: # The user the authenticated user is conversing with
 *           $ref: '#/components/schemas/ConversationParticipant'
 *         lastMessageSnippet:
 *           type: string
 *           nullable: true
 *         lastMessageAt:
 *           type: string
 *           format: "date-time"
 *           nullable: true
 *         unreadCount: # Unread count for the authenticated user in this conversation
 *           type: integer
 *         status: # Status of the conversation for the authenticated user (active/archived)
 *           type: string
 *           enum: [active, archived]
 *         # productId: # Optional context
 *         #   type: string
 *         #   format: uuid
 *         # orderId: # Optional context
 *         #   type: string
 *         #   format: uuid
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedConversations:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConversationListItem'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     ConversationDetail: # Full conversation details including messages
 *       allOf:
 *         - $ref: '#/components/schemas/ConversationListItem'
 *         - type: object
 *           properties:
 *             messages: # Optionally include some recent messages or use a separate endpoint
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessageResponse'
 *             # Include productId, orderId if relevant and populated
 *             productContext:
 *                $ref: '#/components/schemas/Product' # A summarized product view
 *                nullable: true
 *             orderContext:
 *                # $ref: '#/components/schemas/OrderSummary' # A summarized order view
 *                type: object # Define OrderSummary if needed
 *                nullable: true
 *     InitiateConversationInput:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: "ID of the product for product-related inquiry. Mutually exclusive with orderId and sellerUserId unless specific logic allows."
 *         orderId:
 *           type: string
 *           format: uuid
 *           description: "ID of the order for order-related inquiry. Mutually exclusive with productId and sellerUserId."
 *         sellerUserId:
 *           type: string
 *           format: uuid
 *           description: "ID of the seller for general inquiry to a specific seller. Mutually exclusive with productId and orderId."
 *         initialMessageText:
 *           type: string
 *           minLength: 1
 *           description: "The initial message text from the buyer."
 *       # Use oneOf or anyOf in Zod to ensure only one context ID is provided, or handle in service
 *       # For OpenAPI, you might list them and describe mutual exclusivity.
 *       # Example Zod refinement:
 *       # .refine(data =>
 *       #   (data.productId && !data.orderId && !data.sellerUserId) ||
 *       #   (data.orderId && !data.productId && !data.sellerUserId) ||
 *       #   (data.sellerUserId && !data.productId && !data.orderId),
 *       #  { message: "Provide exactly one of productId, orderId, or sellerUserId." }
 *       # )
 *       required: # At least one context + initial message
 *         - initialMessageText
 */

export const listConversationsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      status: z
        .enum(["active", "archived"])
        .optional()
        .describe(
          "Filter by conversation status (active or archived) for the authenticated user.",
        ),
      sort_by: z
        .enum(["last_message_at", "unread_count"])
        .default("last_message_at")
        .optional(),
      // order for sort_by is typically 'desc' for last_message_at and unread_count
    })
    .strict(),
});

export const getConversationParamsSchema = z.object({
  params: z.object({
    conversationId: objectIdSchema,
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    conversationId: objectIdSchema,
  }),
  body: z.object({
    messageText: z.string().trim().min(1, "Message text cannot be empty"),
    messageType: z
      .enum(["text", "image_url", "product_link", "order_link"])
      .default("text")
      .optional(),
  }),
});

export const initiateConversationSchema = z.object({
  body: z
    .object({
      productId: objectIdSchema.optional(),
      orderId: objectIdSchema.optional(),
      sellerUserId: objectIdSchema.optional(),
      initialMessageText: z
        .string()
        .trim()
        .min(1, "Initial message text is required"),
    })
    .refine(
      (data) => {
        const providedContexts = [
          data.productId,
          data.orderId,
          data.sellerUserId,
        ].filter(Boolean).length;
        return providedContexts === 1; // Exactly one context must be provided
      },
      {
        message:
          "Exactly one of productId, orderId, or sellerUserId must be provided as context.",
        // path: ['productId'], // Or a general error path
      },
    ),
});
