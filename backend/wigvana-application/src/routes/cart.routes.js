import express from "express";
import { cartController } from "../controllers/cart.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createCartSchema,
  addItemToCartSchema,
  viewCartParamsSchema,
  updateCartItemSchema,
  removeCartItemParamsSchema,
  clearCartParamsSchema,
} from "../dtos/cart.dto.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Anonymous Cart
 *   description: Shopping cart operations for anonymous (unauthenticated) users. Client must manage cartId.
 */

/**
 * @openapi
 * /carts:
 *   post:
 *     summary: Create a new anonymous cart and add an item (typically the first item).
 *     tags: [Anonymous Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemInput'
 *     responses:
 *       201:
 *         description: Cart created and item added successfully. Returns cart details including the `id` (cartId).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateCartResponse' # This is effectively Cart schema
 *       400:
 *         description: Bad request (e.g., validation error, product/variant issue, insufficient stock).
 *       404:
 *         description: Product or variant not found.
 */
router.post(
  "/",
  validate(createCartSchema),
  cartController.createAnonymousCart,
);

/**
 * @openapi
 * /carts/{cartId}/items:
 *   post:
 *     summary: Add an item to an existing anonymous cart.
 *     tags: [Anonymous Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCartId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemInput'
 *     responses:
 *       200:
 *         description: Item added to cart successfully. Returns updated cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Bad request (e.g., validation error, insufficient stock).
 *       404:
 *         description: Cart, Product, or Variant not found.
 */
router.post(
  "/:cartId/items",
  validate(addItemToCartSchema),
  cartController.addItemToAnonymousCart,
);

/**
 * @openapi
 * /carts/{cartId}:
 *   get:
 *     summary: View the anonymous cart.
 *     tags: [Anonymous Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCartId'
 *     responses:
 *       200:
 *         description: Cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found.
 */
router.get(
  "/:cartId",
  validate(viewCartParamsSchema),
  cartController.viewAnonymousCart,
);

/**
 * @openapi
 * /carts/{cartId}/items/{itemId}:
 *   put:
 *     summary: Update item quantity in the anonymous cart.
 *     tags: [Anonymous Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCartId'
 *       - $ref: '#/components/parameters/pathItemId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemInput'
 *     responses:
 *       200:
 *         description: Item quantity updated successfully. Returns updated cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Bad request (e.g., validation error, insufficient stock).
 *       404:
 *         description: Cart or item not found.
 */
router.put(
  "/:cartId/items/:itemId",
  validate(updateCartItemSchema),
  cartController.updateAnonymousCartItem,
);

/**
 * @openapi
 * /carts/{cartId}/items/{itemId}:
 *   delete:
 *     summary: Remove an item from the anonymous cart.
 *     tags: [Anonymous Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCartId'
 *       - $ref: '#/components/parameters/pathItemId'
 *     responses:
 *       200:
 *         description: Item removed successfully. Returns updated cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart or item not found.
 */
router.delete(
  "/:cartId/items/:itemId",
  validate(removeCartItemParamsSchema),
  cartController.removeAnonymousCartItem,
);

/**
 * @openapi
 * /carts/{cartId}:
 *   delete:
 *     summary: Clear the anonymous cart (remove all items).
 *     tags: [Anonymous Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCartId'
 *     responses:
 *       200:
 *         description: Cart cleared successfully. Returns the (now empty) cart details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found.
 */
router.delete(
  "/:cartId",
  validate(clearCartParamsSchema),
  cartController.clearAnonymousCart,
);

export default router;
