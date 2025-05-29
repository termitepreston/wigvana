import httpStatusCodes from "http-status-codes";
import { productService } from "../services/product.service.js";
import ApiError from "../errors/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";

/**
 * Controller to list all products with filtering, sorting, and pagination.
 * @type {import('express').RequestHandler}
 */
const listProducts = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, [
    "category",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
    "minPrice",
    "maxPrice",
    "brand",
  ]);
  const result = await productService.listProducts(queryOptions);
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller to get details of a specific product.
 * @type {import('express').RequestHandler}
 */
const getProductDetails = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  res.status(httpStatusCodes.OK).send(product);
});

/**
 * Controller to list product variants for a specific product.
 * @type {import('express').RequestHandler}
 */
const listProductVariants = catchAsync(async (req, res) => {
  const variants = await productService.listProductVariants(
    req.params.productId,
  );
  res.status(httpStatusCodes.OK).send(variants);
});

/**
 * Controller to get details of a specific product variant.
 * @type {import('express').RequestHandler}
 */
const getProductVariantDetails = catchAsync(async (req, res) => {
  const variant = await productService.getProductVariantById(
    req.params.productId,
    req.params.variantId,
  );
  res.status(httpStatusCodes.OK).send(variant);
});

/**
 * Controller to retrieve featured products.
 * @type {import('express').RequestHandler}
 */
const getFeaturedProducts = catchAsync(async (req, res) => {
  const featuredProducts = await productService.getFeaturedProducts();
  res.status(httpStatusCodes.OK).send(featuredProducts);
});

/**
 * Controller to list reviews for a specific product.
 * @type {import('express').RequestHandler}
 */
const listProductReviews = catchAsync(async (req, res) => {
  const paginationOptions = pick(req.query, ["page", "limit"]);
  const result = await productService.listProductReviews(
    req.params.productId,
    paginationOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller for a seller to create a new product.
 * @type {import('express').RequestHandler}
 */
const createMyProduct = catchAsync(async (req, res) => {
  const product = await productService.createSellerProduct(
    req.user.id,
    req.body,
  );
  res.status(httpStatusCodes.CREATED).send(product);
});

/**
 * Controller for a seller to list their own products.
 * @type {import('express').RequestHandler}
 */
const listMyProducts = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, [
    "page",
    "limit",
    "status",
    "search",
    "categoryId",
    "sort_by",
    "order",
  ]);
  const result = await productService.listSellerOwnedProducts(
    req.user.id,
    queryOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller for a seller to get details of one of their own products.
 * @type {import('express').RequestHandler}
 */
const getMyProductDetails = catchAsync(async (req, res) => {
  const product = await productService.getSellerOwnedProductById(
    req.user.id,
    req.params.productId,
  );
  res.status(httpStatusCodes.OK).send(product);
});

/**
 * Controller for a seller to update one of their own products (PUT).
 * @type {import('express').RequestHandler}
 */
const updateMyProduct = catchAsync(async (req, res) => {
  const product = await productService.updateSellerOwnedProduct(
    req.user.id,
    req.params.productId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(product);
});

/**
 * Controller for a seller to partially update one of their own products (PATCH).
 * @type {import('express').RequestHandler}
 */
const patchMyProduct = catchAsync(async (req, res) => {
  const product = await productService.patchSellerOwnedProduct(
    req.user.id,
    req.params.productId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(product);
});

/**
 * Controller for a seller to delete one of their own products.
 * @type {import('express').RequestHandler}
 */
const deleteMyProduct = catchAsync(async (req, res) => {
  await productService.deleteSellerOwnedProduct(
    req.user.id,
    req.params.productId,
  );
  res.status(httpStatusCodes.NO_CONTENT).send();
});

/**
 * Controller for a seller to upload images for their product.
 * @type {import('express').RequestHandler}
 */
const uploadMyProductImages = catchAsync(async (req, res) => {
  // req.files will be populated by multer middleware (to be added to the route)
  if (!req.files || req.files.length === 0) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "No image files were uploaded.",
    );
  }
  const productImages = await productService.addProductImages(
    req.user.id,
    req.params.productId,
    req.files,
  );
  res.status(httpStatusCodes.CREATED).send(productImages);
});

/**
 * Controller for a seller to delete an image for their product.
 * @type {import('express').RequestHandler}
 */
const deleteMyProductImage = catchAsync(async (req, res) => {
  await productService.deleteProductImage(
    req.user.id,
    req.params.productId,
    req.params.imageId,
  );
  res.status(httpStatusCodes.NO_CONTENT).send();
});

export const productController = {
  listProducts,
  getProductDetails,
  listProductVariants,
  getProductVariantDetails,
  getFeaturedProducts,
  listProductReviews,
  createMyProduct,
  listMyProducts,
  getMyProductDetails,
  updateMyProduct,
  patchMyProduct,
  deleteMyProduct,
  uploadMyProductImages,
  deleteMyProductImage,
};
