import httpStatusCodes from "http-status-codes";
import { cartService } from "../services/cart.service.js";
import catchAsync from "../utils/catchAsync.js";
// No need to import 'pick' here as path/body params are directly accessed or validated by DTOs

// --- Anonymous Cart Controllers ---

/**
 * Controller to create a new anonymous cart and add the first item.
 * The client does not send a cartId for this operation.
 * A new cartId (anonymousCartToken) will be generated and returned.
 * @type {import('express').RequestHandler}
 */
const createAnonymousCart = catchAsync(async (req, res) => {
	// req.body is validated by 'createCartSchema' DTO
	const cart = await cartService.createAnonymousCartWithItem(req.body);
	res.status(httpStatusCodes.CREATED).send(cart);
});

/**
 * Controller to add an item to an existing anonymous cart.
 * Client must provide a valid cartId (anonymousCartToken) in the path.
 * @type {import('express').RequestHandler}
 */
const addItemToAnonymousCart = catchAsync(async (req, res) => {
	// req.params.cartId and req.body are validated by 'addItemToCartSchema' DTO
	const cart = await cartService.addItemToAnonymousCart(
		req.params.cartId,
		req.body,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to view the anonymous cart.
 * Client must provide a valid cartId (anonymousCartToken) in the path.
 * @type {import('express').RequestHandler}
 */
const viewAnonymousCart = catchAsync(async (req, res) => {
	// req.params.cartId is validated by 'viewCartParamsSchema' DTO
	const cart = await cartService.viewAnonymousCart(req.params.cartId);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to update item quantity in the anonymous cart.
 * Client must provide a valid cartId and itemId in the path.
 * @type {import('express').RequestHandler}
 */
const updateAnonymousCartItem = catchAsync(async (req, res) => {
	// req.params.cartId, req.params.itemId, and req.body.quantity validated by 'updateCartItemSchema'
	const cart = await cartService.updateAnonymousCartItem(
		req.params.cartId,
		req.params.itemId,
		req.body.quantity,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to remove an item from the anonymous cart.
 * Client must provide a valid cartId and itemId in the path.
 * @type {import('express').RequestHandler}
 */
const removeAnonymousCartItem = catchAsync(async (req, res) => {
	// req.params.cartId and req.params.itemId validated by 'removeCartItemParamsSchema'
	const cart = await cartService.removeAnonymousCartItem(
		req.params.cartId,
		req.params.itemId,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to clear the anonymous cart (remove all items).
 * Client must provide a valid cartId (anonymousCartToken) in the path.
 * @type {import('express').RequestHandler}
 */
const clearAnonymousCart = catchAsync(async (req, res) => {
	// req.params.cartId validated by 'clearCartParamsSchema'
	const cart = await cartService.clearAnonymousCart(req.params.cartId);
	res.status(httpStatusCodes.OK).send(cart); // Send back the empty cart or a success message
});

// --- Authenticated Buyer Cart Controllers ---
// These controllers assume `req.user.id` is available from the `protect` middleware.

/**
 * Controller to get the authenticated buyer's cart.
 * The cart is identified by the authenticated user's ID.
 * @type {import('express').RequestHandler}
 */
const getMyCart = catchAsync(async (req, res) => {
	const cart = await cartService.getBuyerCart(req.user.id);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to add an item to the authenticated buyer's cart.
 * @type {import('express').RequestHandler}
 */
const addItemToMyCart = catchAsync(async (req, res) => {
	// req.body is validated by 'createCartSchema' (reused for item input structure)
	const cart = await cartService.addItemToBuyerCart(req.user.id, req.body);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to update item quantity in the authenticated buyer's cart.
 * @type {import('express').RequestHandler}
 */
const updateMyCartItem = catchAsync(async (req, res) => {
	// req.params.itemId and req.body.quantity validated by adapted 'updateCartItemSchema'
	const cart = await cartService.updateBuyerCartItem(
		req.user.id,
		req.params.itemId,
		req.body.quantity,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to remove an item from the authenticated buyer's cart.
 * @type {import('express').RequestHandler}
 */
const removeMyCartItem = catchAsync(async (req, res) => {
	// req.params.itemId validated by adapted 'removeCartItemParamsSchema'
	const cart = await cartService.removeBuyerCartItem(
		req.user.id,
		req.params.itemId,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to clear the authenticated buyer's cart.
 * @type {import('express').RequestHandler}
 */
const clearMyCart = catchAsync(async (req, res) => {
	const cart = await cartService.clearBuyerCart(req.user.id);
	res.status(httpStatusCodes.OK).send(cart);
});

/**
 * Controller to merge an anonymous cart into the buyer's authenticated cart,
 * typically done after login.
 * @type {import('express').RequestHandler}
 */
const mergeMyCart = catchAsync(async (req, res) => {
	// req.body.anonymousCartId validated by 'mergeAnonymousCartSchema'
	const cart = await cartService.mergeAnonymousCart(
		req.user.id,
		req.body.anonymousCartId,
	);
	res.status(httpStatusCodes.OK).send(cart);
});

export const cartController = {
	// Anonymous Cart Actions
	createAnonymousCart,
	addItemToAnonymousCart,
	viewAnonymousCart,
	updateAnonymousCartItem,
	removeAnonymousCartItem,
	clearAnonymousCart,
	// Authenticated Buyer Cart Actions
	getMyCart,
	addItemToMyCart,
	updateMyCartItem,
	removeMyCartItem,
	clearMyCart,
	mergeMyCart,
};
