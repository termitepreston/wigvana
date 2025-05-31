import { z } from "zod";

/**
 * @openapi
 * components:
 *   parameters:
 *     pageParam:
 *       name: page
 *       in: query
 *       description: Page number for pagination.
 *       schema:
 *         type: integer
 *         default: 1
 *     limitParam:
 *       name: limit
 *       in: query
 *       description: Number of items per page.
 *       schema:
 *         type: integer
 *         default: 10
 *     pathConversationId:
 *       name: conversationId
 *       in: path
 *       required: true
 *       description: The ID of the conversation.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathProductId:
 *       name: productId
 *       in: path
 *       required: true
 *       description: The ID of the product.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathVariantId:
 *       name: variantId
 *       in: path
 *       required: true
 *       description: The ID of the product variant.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathCategoryId:
 *       name: categoryId
 *       in: path
 *       required: true
 *       description: The ID of the category.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathCartId:
 *       name: cartId
 *       in: path
 *       required: true
 *       description: The ID of the anonymous cart.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathItemId:
 *       name: itemId
 *       in: path
 *       required: true
 *       description: The ID of the item in the cart.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathOrderId:
 *        name: orderId
 *        id: path
 *        required: true
 *        description: The ID of the order.
 *        schema:
 *          type: string
 *          format: uuid
 *     pathReviewId:
 *       name: reviewId
 *       in: path
 *       required: true
 *       description: The ID of the review.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathUserId:
 *       name: userId
 *       in: path
 *       required: true
 *       description: The ID of the user.
 *       schema:
 *        type: string
 *        format: uuid
 *     pathAddressId:
 *       name: addressId
 *       in: path
 *       required: true
 *       description: The ID of the address.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathPaymentMethodId:
 *       name: paymentMethodId
 *       in: path
 *       required: true
 *       description: The ID of the payment method.
 *       schema:
 *         type: string
 *         format: uuid
 *     pathApplicationId:
 *       name: applicationId
 *       in: path
 *       required: true
 *       description: The ID of the seller application.
 *       schema:
 *         type: string
 *         format: uuid
 *   schemas:
 *     PaginationMetadata:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 5
 *         totalResults:
 *           type: integer
 *           example: 48
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPrevPage:
 *           type: boolean
 *           example: false
 *     ProductSortByEnum:
 *       type: string
 *       enum: [name, basePrice, averageRating, createdAt, updatedAt]
 */

export const objectIdSchema = z
	.string()
	.uuid({ message: "Invalid UUID format" });

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export const productSortBySchema = z
	.enum([
		"name",
		"basePrice", // or 'price' depending on your variant structure preference
		"averageRating",
		"createdAt",
		"updatedAt",
	])
	.default("createdAt");

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const baseProductResponseSchema = {
	// For OpenAPI, not Zod direct use
	id: { type: "string", format: "uuid" },
	name: { type: "string" },
	slug: { type: "string" },
	description: { type: "string" },
	basePrice: { type: "number", format: "float" },
	currency: { type: "string", example: "USD" },
	averageRating: { type: "number", format: "float", minimum: 0, maximum: 5 },
	reviewCount: { type: "integer", minimum: 0 },
	// Add other common fields like main image, brand, etc.
	// categoryId: { type: 'string', format: 'uuid' },
	// sellerId: { type: 'string', format: 'uuid' },
	createdAt: { type: "string", format: "date-time" },
	updatedAt: { type: "string", format: "date-time" },
};
