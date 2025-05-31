import { z } from "zod";
import { objectIdSchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - variantId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: The ID of the product.
 *         variantId:
 *           type: string
 *           format: uuid
 *           description: The ID of the product variant.
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: The quantity of the item.
 *     CartItemResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/CartItemInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: The ID of the cart item.
 *             priceAtAddition:
 *               type: number
 *               format: float
 *               description: Price of the variant when added to cart.
 *             currencyAtAddition:
 *               type: string
 *               example: "USD"
 *             productNameSnapshot: # Example of denormalized data for display
 *                type: string
 *             variantAttributesSnapshot:
 *                type: object
 *             # You might also include product image URL here
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the cart (anonymousCartToken for anonymous users).
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: The ID of the user if authenticated, null otherwise.
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItemResponse'
 *         totalItems:
 *           type: integer
 *           description: Total number of unique items in the cart.
 *         totalQuantity:
 *           type: integer
 *           description: Total quantity of all items in the cart.
 *         subtotal:
 *           type: number
 *           format: float
 *           description: Total price of items in the cart (before shipping, taxes, discounts).
 *         currency:
 *           type: string
 *           example: "USD"
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     CreateCartResponse: # Specific for the first cart creation
 *       allOf:
 *         - $ref: '#/components/schemas/Cart'
 *         # 'id' here is the cartId the client needs to store
 *
 *     UpdateCartItemInput:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 0 # Allow 0 to effectively remove item, or handle removal separately.
 *                      # Let's assume minimum 1 for update, and 0 means delete.
 *                      # For this requirement, PUT is for quantity > 0.
 *     MergeAnonymousCartDto:
 *       type: object
 *       required:
 *         - anonymousCartId
 *       properties:
 *         anonymousCartId:
 *           type: string
 *           format: uuid # Assuming your anonymousCartToken is a UUID
 *           description: "The ID (anonymousCartToken) of the anonymous cart to be merged into the authenticated buyer's cart."
 *           example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 */

export const createCartSchema = z.object({
	body: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
		quantity: z.coerce.number().int().min(1),
	}),
});

export const addItemToCartSchema = z.object({
	params: z.object({
		cartId: objectIdSchema,
	}),
	body: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
		quantity: z.coerce.number().int().min(1),
	}),
});

export const viewCartParamsSchema = z.object({
	params: z.object({
		cartId: objectIdSchema,
	}),
});

export const updateCartItemSchema = z.object({
	params: z.object({
		cartId: objectIdSchema,
		itemId: objectIdSchema,
	}),
	body: z.object({
		quantity: z.coerce.number().int().min(1), // Quantity must be at least 1 for update
	}),
});

export const removeCartItemParamsSchema = z.object({
	params: z.object({
		cartId: objectIdSchema,
		itemId: objectIdSchema,
	}),
});

export const clearCartParamsSchema = z.object({
	params: z.object({
		cartId: objectIdSchema,
	}),
});

export const mergeAnonymousCartSchema = z.object({
	body: z.object({
		anonymousCartId: objectIdSchema.describe(
			"The ID (anonymousCartToken) of the anonymous cart to merge.",
		),
	}),
});
