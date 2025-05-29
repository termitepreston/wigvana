import express from "express";
import { cartController } from "../controllers/cart.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
	// DTOs for cart item input (reused from general cart DTOs)
	createCartSchema, // Zod schema for { body: { productId, variantId, quantity } }
	// DTOs for updating cart item (reused and adapted)
	updateCartItemSchema,
	// DTOs for removing cart item (reused and adapted)
	removeCartItemParamsSchema,
	// DTO for merging anonymous cart
	mergeAnonymousCartSchema,
} from "../dtos/cart.dto.js";
// No need to import objectIdSchema directly if DTOs already use it for params like itemId

const router = express.Router();

// Apply authentication and buyer role authorization to all routes in this file
router.use(protect);
router.use(authorize(["buyer"]));

/**
 * @openapi
 * tags:
 *   name: Buyer Cart
 *   description: Shopping cart operations for authenticated buyers.
 * components:
 *   securitySchemes:
 *     bearerAuth: # Ensures this is documented if not globally defined for all /me routes
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   parameters:
 *      # pathItemId is already defined in common.dto.js and referenced in cart.dto.js's OpenAPI schemas
 *      # But if it wasn't, you'd define it here or ensure it's in common.dto.js's OpenAPI components
 *      # pathItemId:
 *      #   name: itemId
 *      #   in: path
 *      #   required: true
 *      #   description: The ID of the item in the cart.
 *      #   schema:
 *      #     type: string
 *      #     format: uuid
 */

/**
 * @openapi
 * /me/cart:
 *   get:
 *     summary: Get the buyer's cart
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer's cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a buyer).
 */
router.get("/", cartController.getMyCart);

/**
 * @openapi
 * /me/cart/items:
 *   post:
 *     summary: Add an item to the buyer's cart
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemInput' # Reuses the general input schema
 *     responses:
 *       200:
 *         description: Item added successfully. Returns updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Bad request (e.g., validation error, insufficient stock).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Product or variant not found.
 */
router.post(
	"/items",
	validate(createCartSchema),
	cartController.addItemToMyCart,
);

/**
 * @openapi
 * /me/cart/items/{itemId}:
 *   put:
 *     summary: Update item quantity in the buyer's cart
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathItemId' # Defined in common.dto.js or cart.dto.js
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemInput'
 *     responses:
 *       200:
 *         description: Item updated successfully. Returns updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Bad request (e.g., validation error, quantity < 1, insufficient stock).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Item not found in cart.
 */
router.put(
	"/items/:itemId",
	validate(
		// We adapt updateCartItemSchema which expects cartId in params.
		// For /me/cart routes, cartId is implicit from the authenticated user.
		// The DTO for validation should only care about itemId in params and quantity in body.
		updateCartItemSchema.omit({ params: { cartId: true } }), // Remove cartId from param validation for this route
	),
	cartController.updateMyCartItem,
);

/**
 * @openapi
 * /me/cart/items/{itemId}:
 *   delete:
 *     summary: Remove an item from the buyer's cart
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathItemId'
 *     responses:
 *       200:
 *         description: Item removed successfully. Returns updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Item not found in cart.
 */
router.delete(
	"/items/:itemId",
	validate(
		// Similar to PUT, remove cartId from param validation for this route.
		removeCartItemParamsSchema.omit({ params: { cartId: true } }),
	),
	cartController.removeMyCartItem,
);

/**
 * @openapi
 * /me/cart:
 *   delete:
 *     summary: Clear the buyer's cart
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully. Returns updated (empty) cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.delete("/", cartController.clearMyCart); // No params or body validation needed beyond auth

/**
 * @openapi
 * /me/cart/merge-anonymous:
 *   post:
 *     summary: Merge anonymous cart into buyer's cart (after login)
 *     tags: [Buyer Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MergeAnonymousCartDto'
 *     responses:
 *       200:
 *         description: Carts merged successfully. Returns the updated buyer's cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Bad request (e.g., invalid anonymousCartId).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Anonymous cart not found.
 */
router.post(
	"/merge-anonymous",
	validate(mergeAnonymousCartSchema),
	cartController.mergeMyCart,
);

export default router;
