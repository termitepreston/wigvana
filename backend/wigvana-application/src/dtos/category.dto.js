import { z } from "zod";
import {
  objectIdSchema,
  paginationQuerySchema,
  productSortBySchema,
  sortOrderSchema,
} from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *         # subcategories: # If you decide to populate/show them
 *         #   type: array
 *         #   items:
 *         #     $ref: '#/components/schemas/Category'
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedCategories:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 */

export const getCategoryParamsSchema = z.object({
  params: z.object({
    categoryId: objectIdSchema,
  }),
});

export const listProductsInCategoryParamsSchema = z.object({
  params: z.object({
    categoryId: objectIdSchema,
  }),
  query: paginationQuerySchema
    .extend({
      search: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe(
          "Search query for product name or description within category",
        ),
      sort_by: productSortBySchema.optional(),
      order: sortOrderSchema.optional(),
      minPrice: z.coerce
        .number()
        .min(0)
        .optional()
        .describe("Minimum price filter"),
      maxPrice: z.coerce
        .number()
        .min(0)
        .optional()
        .describe("Maximum price filter"),
      brand: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Filter by brand name"),
    })
    .strict(),
});

export const listCategoriesQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      name: z
        .string()
        .optional()
        .describe("Filter categories by name (partial match)"),
      slug: z
        .string()
        .optional()
        .describe("Filter categories by slug (exact match)"),
      parentId: objectIdSchema
        .or(z.literal("null"))
        .optional()
        .describe('Filter by parent ID or list top-level categories if "null"'),
      // 'null' as string because query params are strings
    })
    .strict(),
});
