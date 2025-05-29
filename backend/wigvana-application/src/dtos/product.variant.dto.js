import { z } from "zod";
import { objectIdSchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductVariantAttributesInput: # For OpenAPI documentation of attributes
 *       type: object
 *       description: "Key-value pairs describing the variant (e.g., {\"color\": \"Red\", \"size\": \"M\"}). Keys and values are strings."
 *       additionalProperties:
 *         type: string
 *       example:
 *         color: "Red"
 *         size: "Medium"
 *     ProductVariantInput:
 *       type: object
 *       required:
 *         - sku
 *         - attributes
 *         - price
 *         - stockQuantity
 *       properties:
 *         sku:
 *           type: string
 *           example: "TSHIRT-RED-M-001"
 *         attributes:
 *           $ref: '#/components/schemas/ProductVariantAttributesInput'
 *         price:
 *           type: number
 *           format: float
 *           example: 22.99
 *         salePrice:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 19.99
 *         saleStartDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         saleEndDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         stockQuantity:
 *           type: integer
 *           minimum: 0
 *           example: 100
 *         imageIds: # IDs of ProductImage documents
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           nullable: true
 *         weight:
 *           type: object
 *           nullable: true
 *           properties:
 *             value: { type: number, example: 0.5 }
 *             unit: { type: string, example: "kg" }
 *         dimensions: # Example: { length: 10, width: 5, height: 2, unit: 'cm' }
 *           type: object
 *           nullable: true
 *           properties:
 *             length: { type: number }
 *             width: { type: number }
 *             height: { type: number }
 *             unit: { type: string }
 *         isActive:
 *           type: boolean
 *           default: true
 *     ProductVariantResponse: # Defined in product.dto.js, can be referenced
 *       $ref: '#/components/schemas/ProductVariant'
 *     PatchProductVariantInput:
 *       type: object
 *       properties:
 *         sku:
 *           type: string
 *         attributes:
 *           $ref: '#/components/schemas/ProductVariantAttributesInput'
 *         price:
 *           type: number
 *           format: float
 *         salePrice:
 *           type: number
 *           format: float
 *           nullable: true
 *         saleStartDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         saleEndDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         stockQuantity:
 *           type: integer
 *           minimum: 0
 *         imageIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           nullable: true
 *         weight:
 *           type: object
 *           nullable: true
 *           properties:
 *             value: { type: number }
 *             unit: { type: string }
 *         dimensions:
 *           type: object
 *           nullable: true
 *         isActive:
 *           type: boolean
 */

// Zod schema for attributes: a record of string keys to string values
const attributesSchema = z
	.record(z.string(), z.string())
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "Attributes object cannot be empty.",
	});

export const productVariantInputBaseSchema = z
	.object({
		sku: z.string().trim().min(1, "SKU is required"),
		attributes: attributesSchema,
		price: z.coerce.number().positive("Price must be positive"),
		salePrice: z.coerce
			.number()
			.positive("Sale price must be positive")
			.nullable()
			.optional(),
		saleStartDate: z.coerce.date().nullable().optional(),
		saleEndDate: z.coerce.date().nullable().optional(),
		stockQuantity: z.coerce
			.number()
			.int()
			.min(0, "Stock quantity cannot be negative")
			.default(0),
		imageIds: z.array(objectIdSchema).max(5).nullable().optional(), // Max 5 images per variant example
		weight: z
			.object({
				value: z.coerce.number().positive(),
				unit: z.string().min(1),
			})
			.nullable()
			.optional(),
		dimensions: z
			.object({
				length: z.coerce.number().positive(),
				width: z.coerce.number().positive(),
				height: z.coerce.number().positive(),
				unit: z.string().min(1),
			})
			.nullable()
			.optional(),
		isActive: z.boolean().default(true).optional(),
	})
	.refine(
		(data) => {
			// Validate sale dates if salePrice is present
			if (data.salePrice != null) {
				// Use != to catch null or undefined
				if (!data.saleStartDate) return false; // Start date required if sale price
				if (data.saleEndDate && data.saleStartDate > data.saleEndDate)
					return false; // End date must be after start date
			}
			return true;
		},
		{
			message:
				"If salePrice is set, saleStartDate is required. saleEndDate, if set, must be after saleStartDate.",
			path: ["saleStartDate"], // Or a more general path
		},
	);

export const createProductVariantSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
	}),
	body: productVariantInputBaseSchema,
});

// For PUT, typically all fields from base are required or have defaults
export const updateProductVariantSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
	}),
	body: productVariantInputBaseSchema,
});

// For PATCH, all fields are optional
export const patchProductVariantSchema = z.object({
	params: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
	}),
	body: z
		.object({
			sku: z.string().trim().min(1, "SKU is required"),
			attributes: attributesSchema,
			price: z.coerce.number().positive("Price must be positive"),
			salePrice: z.coerce
				.number()
				.positive("Sale price must be positive")
				.nullable()
				.optional(),
			saleStartDate: z.coerce.date().nullable().optional(),
			saleEndDate: z.coerce.date().nullable().optional(),
			stockQuantity: z.coerce
				.number()
				.int()
				.min(0, "Stock quantity cannot be negative")
				.default(0),
			imageIds: z.array(objectIdSchema).max(5).nullable().optional(), // Max 5 images per variant example
			weight: z
				.object({
					value: z.coerce.number().positive(),
					unit: z.string().min(1),
				})
				.nullable()
				.optional(),
			dimensions: z
				.object({
					length: z.coerce.number().positive(),
					width: z.coerce.number().positive(),
					height: z.coerce.number().positive(),
					unit: z.string().min(1),
				})
				.nullable()
				.optional(),
			isActive: z.boolean().default(true).optional(),
		})
		.strip()
		.refine((data) => Object.keys(data).length > 0, {
			message: "At least one field must be provided for update.",
		}),
});

export const productVariantParamsSchema = z.object({
	// For GET one or DELETE
	params: z.object({
		productId: objectIdSchema,
		variantId: objectIdSchema,
	}),
});

export const listProductVariantsParamsSchema = z.object({
	// For GET all for a product
	params: z.object({
		productId: objectIdSchema,
	}),
});
