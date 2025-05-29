import express from "express";
import { categoryController } from "../controllers/category.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  getCategoryParamsSchema,
  listProductsInCategoryParamsSchema,
  listCategoriesQuerySchema,
} from "../dtos/category.dto.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Categories
 *   description: Category browsing for anonymous users.
 */

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List all product categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by category name (case-insensitive, partial match).
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by category slug (exact match).
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent category ID. Send "null" (as a string) for top-level categories.
 *     responses:
 *       200:
 *         description: A paginated list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCategories'
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/",
  validate(listCategoriesQuerySchema),
  categoryController.listCategories,
);

/**
 * @openapi
 * /categories/{categoryId}:
 *   get:
 *     summary: Get details of a specific category
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCategoryId'
 *     responses:
 *       200:
 *         description: Detailed information about the category.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:categoryId",
  validate(getCategoryParamsSchema),
  categoryController.getCategoryDetails,
);

/**
 * @openapi
 * /categories/{categoryId}/products:
 *   get:
 *     summary: List products within a specific category
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/pathCategoryId'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for product name or description within the category.
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, basePrice, averageRating, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A paginated list of products within the category.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts' # Re-use product pagination schema
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/:categoryId/products",
  validate(listProductsInCategoryParamsSchema),
  categoryController.listProductsInCategory,
);

export default router;
