import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";
import ProductImage from "../models/ProductImage.model.js"; // To validate imageIds
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";
import { redisService } from "./redis.service.js"; // For cache invalidation

const PRODUCT_VARIANTS_CACHE_KEY_PREFIX = "product_variants:"; // Defined in product.service.js, reuse
const PRODUCT_DETAIL_CACHE_KEY_PREFIX = "product_detail:"; // Defined in product.service.js, reuse

/**
 * Helper to check if a product belongs to the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} sellerId - The ID of the seller.
 * @returns {Promise<InstanceType<typeof Product>>} The product document if owned.
 * @throws {ApiError} If product not found or not owned by seller.
 */
const checkProductOwnership = async (productId, sellerId) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or you do not own this product.",
    );
  }
  return product;
};

/**
 * Validates if imageIds belong to the product.
 * @param {string} productId - The product ID.
 * @param {Array<string>} imageIds - Array of image IDs to validate.
 */
const validateImageIds = async (productId, imageIds) => {
  if (imageIds && imageIds.length > 0) {
    for (const imgId of imageIds) {
      const image = await ProductImage.findOne({ _id: imgId, productId });
      if (!image) {
        throw new ApiError(
          httpStatusCodes.BAD_REQUEST,
          `Image with ID ${imgId} not found or does not belong to product ${productId}.`,
        );
      }
    }
  }
};

/**
 * Creates a new variant for a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {typeof import('../dtos/product.variant.dto.js').createProductVariantSchema._input.body} variantData - Variant details.
 * @returns {Promise<InstanceType<typeof ProductVariant>>} The created product variant.
 */
const createProductVariant = async (sellerId, productId, variantData) => {
  await checkProductOwnership(productId, sellerId);
  await validateImageIds(productId, variantData.imageIds);

  // Check for SKU uniqueness (globally or per seller, depending on policy)
  const existingSku = await ProductVariant.findOne({ sku: variantData.sku });
  if (existingSku) {
    throw new ApiError(
      httpStatusCodes.CONFLICT,
      `SKU '${variantData.sku}' already exists.`,
    );
  }

  // Optional: Check for attribute combination uniqueness for this product
  // This is more complex, might involve hashing attributes or specific querying.
  // For now, we'll allow duplicate attribute sets if SKUs are different.

  const variant = await ProductVariant.create({
    ...variantData,
    productId,
  });

  await redisService.del(`${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`); // Product details might show variant count/summary
  return variant;
};

/**
 * Lists all variants for a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<Array<InstanceType<typeof ProductVariant>>>} Array of product variants.
 */
const listSellerProductVariants = async (sellerId, productId) => {
  await checkProductOwnership(productId, sellerId);
  // No caching for seller's view as it should be real-time
  return ProductVariant.find({ productId }).sort({ createdAt: -1 }).lean();
};

/**
 * Gets details of a specific variant for a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} variantId - The ID of the variant.
 * @returns {Promise<InstanceType<typeof ProductVariant>>} The product variant document.
 */
const getSellerProductVariantById = async (sellerId, productId, variantId) => {
  await checkProductOwnership(productId, sellerId);
  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product variant not found for this product.",
    );
  }
  return variant;
};

/**
 * Updates a variant for a seller's product (PUT semantics).
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} variantId - The ID of the variant to update.
 * @param {typeof import('../dtos/product.variant.dto.js').updateProductVariantSchema._input.body} updateData - Data for update.
 * @returns {Promise<InstanceType<typeof ProductVariant>>} The updated product variant.
 */
const updateSellerProductVariant = async (
  sellerId,
  productId,
  variantId,
  updateData,
) => {
  await checkProductOwnership(productId, sellerId);
  await validateImageIds(productId, updateData.imageIds);

  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product variant not found.");
  }

  // If SKU is being changed, check for uniqueness
  if (updateData.sku && updateData.sku !== variant.sku) {
    const existingSku = await ProductVariant.findOne({
      sku: updateData.sku,
      _id: { $ne: variantId },
    });
    if (existingSku) {
      throw new ApiError(
        httpStatusCodes.CONFLICT,
        `SKU '${updateData.sku}' already exists.`,
      );
    }
  }

  Object.assign(variant, updateData);
  await variant.save();

  await redisService.del(`${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  return variant;
};

/**
 * Partially updates a variant for a seller's product (PATCH semantics).
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} variantId - The ID of the variant to update.
 * @param {typeof import('../dtos/product.variant.dto.js').patchProductVariantSchema._input.body} updateData - Data for partial update.
 * @returns {Promise<InstanceType<typeof ProductVariant>>} The updated product variant.
 */
const patchSellerProductVariant = async (
  sellerId,
  productId,
  variantId,
  updateData,
) => {
  await checkProductOwnership(productId, sellerId);
  if (updateData.imageIds)
    await validateImageIds(productId, updateData.imageIds);

  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product variant not found.");
  }

  // If SKU is being changed, check for uniqueness
  if (updateData.sku && updateData.sku !== variant.sku) {
    const existingSku = await ProductVariant.findOne({
      sku: updateData.sku,
      _id: { $ne: variantId },
    });
    if (existingSku) {
      throw new ApiError(
        httpStatusCodes.CONFLICT,
        `SKU '${updateData.sku}' already exists.`,
      );
    }
  }

  // Apply partial updates
  for (const key of Object.keys(updateData)) {
    variant[key] = updateData[key];
  }

  await variant.save();

  await redisService.del(`${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  return variant;
};

/**
 * Deletes a variant from a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} variantId - The ID of the variant to delete.
 * @returns {Promise<void>}
 */
const deleteSellerProductVariant = async (sellerId, productId, variantId) => {
  await checkProductOwnership(productId, sellerId);
  const variant = await ProductVariant.findOne({ _id: variantId, productId });
  if (!variant) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product variant not found.");
  }

  // TODO: Check if variant is in active orders or carts, handle gracefully.
  await variant.deleteOne();

  await redisService.del(`${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
};

export const productVariantService = {
  createProductVariant,
  listSellerProductVariants,
  getSellerProductVariantById,
  updateSellerProductVariant,
  patchSellerProductVariant,
  deleteSellerProductVariant,
};
