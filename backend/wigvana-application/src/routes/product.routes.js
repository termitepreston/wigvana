import express from "express";
import { productController } from "../controllers/product.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listProductsQuerySchema,
  getProductParamsSchema,
  listProductVariantsParamsSchema,
  getProductVariantParamsSchema,
  listProductReviewsParamsSchema,
} from "../dtos/product.dto.js";

import { reviewController } from "../controllers/review.controller.js";
import { createReviewSchema } from "../dtos/review.dto.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Product browsing and information for anonymous users.
 */

/**
 * @openapi
 * /products/featured:
 *   get:
 *     summary: Retrieve featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of featured products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/featured", productController.getFeaturedProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List all products with filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for product name or description.
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, basePrice, averageRating, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page.
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum price filter.
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum price filter.
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand name.
 *     responses:
 *       200:
 *         description: A paginated list of products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts'
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/",
  validate(listProductsQuerySchema),
  productController.listProducts,
);

/**
 * @openapi
 * /products/{productId}:
 *   get:
 *     summary: Get details of a specific product
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     responses:
 *       200:
 *         description: Detailed information about the product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product' # You might want a more detailed ProductDetail schema
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:productId",
  validate(getProductParamsSchema),
  productController.getProductDetails,
);

/**
 * @openapi
 * /products/{productId}/variants:
 *   get:
 *     summary: List product variants for a specific product
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     responses:
 *       200:
 *         description: A list of product variants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariant'
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:productId/variants",
  validate(listProductVariantsParamsSchema),
  productController.listProductVariants,
);

/**
 * @openapi
 * /products/{productId}/variants/{variantId}:
 *   get:
 *     summary: Get details of a specific product variant
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *       - $ref: '#/components/parameters/pathVariantId'
 *     responses:
 *       200:
 *         description: Detailed information about the product variant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       404:
 *         description: Product or variant not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:productId/variants/:variantId",
  validate(getProductVariantParamsSchema),
  productController.getProductVariantDetails,
);

/**
 * @openapi
 * /products/{productId}/reviews:
 *   get:
 *     summary: List reviews for a specific product
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: A paginated list of reviews for the product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReviews'
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:productId/reviews",
  validate(listProductReviewsParamsSchema),
  productController.listProductReviews,
);

// ... (existing router definitions)

/**
 * @openapi
 * /products/{productId}/reviews:
 *   post:
 *     summary: Write a review for a purchased product
 *     tags: [Products, Buyer Reviews] # Add Buyer Reviews tag
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Bad request (validation error).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (e.g., user did not purchase product).
 *       404:
 *         description: Product not found.
 *       409:
 *         description: Conflict (user already reviewed this product).
 */
router.post(
  "/:productId/reviews",
  protect,
  authorize(["buyer"]),
  validate(createReviewSchema),
  reviewController.writeProductReview,
);

export default router;
