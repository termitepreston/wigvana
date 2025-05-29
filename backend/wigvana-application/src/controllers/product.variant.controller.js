import httpStatusCodes from "http-status-codes";
import { productVariantService } from "../services/product.variant.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Controller for a seller to add a variant to their product.
 * @type {import('express').RequestHandler}
 */
const addMyProductVariant = catchAsync(async (req, res) => {
	const variant = await productVariantService.createProductVariant(
		req.user.id,
		req.params.productId,
		req.body,
	);
	res.status(httpStatusCodes.CREATED).send(variant);
});

/**
 * Controller for a seller to list variants for their product.
 * @type {import('express').RequestHandler}
 */
const listMyProductVariants = catchAsync(async (req, res) => {
	const variants = await productVariantService.listSellerProductVariants(
		req.user.id,
		req.params.productId,
	);
	res.status(httpStatusCodes.OK).send(variants);
});

/**
 * Controller for a seller to get details of a specific variant for their product.
 * @type {import('express').RequestHandler}
 */
const getMyProductVariantDetails = catchAsync(async (req, res) => {
	const variant = await productVariantService.getSellerProductVariantById(
		req.user.id,
		req.params.productId,
		req.params.variantId,
	);
	res.status(httpStatusCodes.OK).send(variant);
});

/**
 * Controller for a seller to update a variant for their product (PUT).
 * @type {import('express').RequestHandler}
 */
const updateMyProductVariant = catchAsync(async (req, res) => {
	const variant = await productVariantService.updateSellerProductVariant(
		req.user.id,
		req.params.productId,
		req.params.variantId,
		req.body,
	);
	res.status(httpStatusCodes.OK).send(variant);
});

/**
 * Controller for a seller to partially update a variant for their product (PATCH).
 * @type {import('express').RequestHandler}
 */
const patchMyProductVariant = catchAsync(async (req, res) => {
	const variant = await productVariantService.patchSellerProductVariant(
		req.user.id,
		req.params.productId,
		req.params.variantId,
		req.body,
	);
	res.status(httpStatusCodes.OK).send(variant);
});

/**
 * Controller for a seller to delete a variant from their product.
 * @type {import('express').RequestHandler}
 */
const deleteMyProductVariant = catchAsync(async (req, res) => {
	await productVariantService.deleteSellerProductVariant(
		req.user.id,
		req.params.productId,
		req.params.variantId,
	);
	res.status(httpStatusCodes.NO_CONTENT).send();
});

export const productVariantController = {
	addMyProductVariant,
	listMyProductVariants,
	getMyProductVariantDetails,
	updateMyProductVariant,
	patchMyProductVariant,
	deleteMyProductVariant,
};
