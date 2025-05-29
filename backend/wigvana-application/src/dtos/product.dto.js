import { z } from "zod";
import {
	objectIdSchema,
	paginationQuerySchema,
	productSortBySchema,
	sortOrderSchema,
	baseProductResponseSchema,
} from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         # $ref: '#/components/schemas/BaseProductResponse'
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         brand:
 *           type: string
 *           nullable: true
 *         basePrice:
 *           type: number
 *           format: float
 *         currency:
 *           type: string
 *           example: "USD"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isFeatured:
 *           type: boolean
 *         averageRating:
 *           type: number
 *           format: float
 *         reviewCount:
 *           type: integer
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: "ID of the main category this product belongs to."
 *         sellerId:
 *           type: string
 *           format: uuid
 *           description: "ID of the seller who owns this product."
 *         # Add ProductImage array and ProductVariant array if you embed them
 *         # For detailed product view, you might want to include variants or a primary image.
 *         # For list view, it might be more summarized.
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         sku:
 *           type: string
 *         attributes:
 *           type: object
 *           description: "Key-value pairs, e.g., {\"color\": \"Red\", \"size\": \"M\"}"
 *           additionalProperties: true
 *         price:
 *           type: number
 *           format: float
 *         stockQuantity:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         # imageIds:
 *         #   type: array
 *         #   items:
 *         #     type: string
 *         #     format: uuid
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedProducts:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *           description: "ID of the user who wrote the review (can be anonymized in response)."
 *         # userName: # May be denormalized for display
 *         #   type: string
 *         #   example: "John D."
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *           nullable: true
 *         comment:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *         # sellerResponse:
 *         #   $ref: '#/components/schemas/ReviewResponse' # if you embed this
 *     PaginatedReviews:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - categoryId
 *         - basePrice
 *         - currency
 *       properties:
 *         name:
 *           type: string
 *           example: "Handcrafted Wooden Bowl"
 *         description:
 *           type: string
 *           example: "A beautiful bowl made from sustainable wood."
 *         categoryId:
 *           type: string
 *           format: uuid
 *         brand:
 *           type: string
 *           nullable: true
 *           example: "Artisan Woods"
 *         basePrice:
 *           type: number
 *           format: float
 *           example: 29.99
 *         currency:
 *           type: string
 *           example: "USD"
 *           default: "USD"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           example: ["handmade", "kitchen", "decor"]
 *         isPublished: # Seller can choose to publish immediately or save as draft
 *           type: boolean
 *           default: true
 *         shippingDetails: # Optional at creation
 *           type: object
 *           properties:
 *             weight:
 *               type: object
 *               properties: { value: {type: "number"}, unit: {type: "string", example: "kg"}}
 *             dimensions:
 *               type: object
 *               properties: { length: {type: "number"}, width: {type: "number"}, height: {type: "number"}, unit: {type: "string", example: "cm"}}
 *             shippingClass:
 *               type: string
 *               nullable: true
 *     UpdateProductInput: # For PUT (replace all updatable fields)
 *       allOf:
 *         - $ref: '#/components/schemas/CreateProductInput'
 *     PatchProductInput: # For PATCH (partially update)
 *       type: object
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         categoryId: { type: string, format: uuid }
 *         brand: { type: string, nullable: true }
 *         basePrice: { type: number, format: float }
 *         currency: { type: string }
 *         tags: { type: array, items: { type: string }, nullable: true }
 *         isPublished: { type: boolean }
 *         shippingDetails: { type: object, nullable: true } # Same as in CreateProductInput
 *     SellerProductListItem: # Slightly different from public Product, might include status
 *       allOf:
 *         - $ref: '#/components/schemas/Product'
 *         - type: object
 *           properties:
 *             isPublished:
 *               type: boolean
 *             approvalStatus:
 *               type: string
 *               enum: [pending, approved, rejected]
 *     PaginatedSellerProducts:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SellerProductListItem'
 *         # ... pagination metadata from common.dto.js
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 */

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().trim().min(3, "Product name is too short"),
		description: z.string().trim().min(10, "Product description is too short"),
		categoryId: objectIdSchema,
		brand: z.string().trim().min(1).nullable().optional(),
		basePrice: z.coerce.number().positive("Base price must be positive"),
		currency: z.string().trim().length(3).toUpperCase().default("USD"),
		tags: z.array(z.string().trim().min(1)).max(10).nullable().optional(), // Max 10 tags example
		isPublished: z.boolean().default(true).optional(),
		shippingDetails: z
			.object({
				weight: z
					.object({
						value: z.coerce.number().positive(),
						unit: z.string().min(1),
					})
					.optional(),
				dimensions: z
					.object({
						length: z.coerce.number().positive(),
						width: z.coerce.number().positive(),
						height: z.coerce.number().positive(),
						unit: z.string().min(1),
					})
					.optional(),
				shippingClass: z.string().trim().min(1).nullable().optional(),
			})
			.partial()
			.nullable()
			.optional(),
	}),
});

// For PUT, typically all fields are required if not marked optional in Create
export const updateProductSchema = z.object({
	params: z.object({ productId: objectIdSchema }),
	body: createProductSchema.shape.body, // Re-use the same structure as create
});

// For PATCH, all fields are optional
export const patchProductSchema = z.object({
	params: z.object({ productId: objectIdSchema }),
	body: createProductSchema.shape.body
		.partial()
		.strip()
		.refine((data) => Object.keys(data).length > 0, {
			message: "At least one field must be provided for update.",
		}),
});

export const listSellerProductsQuerySchema = z.object({
	query: paginationQuerySchema
		.extend({
			status: z
				.enum(["published", "draft", "pending_approval", "rejected", "all"])
				.optional()
				.describe("Filter products by status (isPublished, approvalStatus)"),
			search: z.string().trim().min(1).optional(),
			categoryId: objectIdSchema.optional(),
			sort_by: productSortBySchema.optional(), // Reuse from common DTOs
			order: z.enum(["asc", "desc"]).default("desc").optional(),
		})
		.strict(),
});

export const listProductsQuerySchema = z.object({
	query: paginationQuerySchema
		.extend({
			category: objectIdSchema
				.optional()
				.describe("Filter by category ID (UUID)"),
			search: z
				.string()
				.trim()
				.min(1)
				.optional()
				.describe("Search query for product name or description"),
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
			// Add more filters like tags, specific attributes if needed
		})
		.strict(), // Ensure no extra query params are passed
});

export const getProductParamsSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
	}),
});

export const listProductVariantsParamsSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
	}),
});

export const getProductVariantParamsSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
	}),
});

export const listProductReviewsParamsSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
	}),
	query: paginationQuerySchema.strict(),
});
