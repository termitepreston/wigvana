import { z } from "zod";
import { objectIdSchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     AddressInput:
 *       type: object
 *       required:
 *         - addressLine1
 *         - city
 *         - stateProvinceRegion
 *         - postalCode
 *         - country
 *         - addressType
 *       properties:
 *         addressLine1:
 *           type: string
 *           example: "123 Main St"
 *         addressLine2:
 *           type: string
 *           nullable: true
 *           example: "Apt 4B"
 *         city:
 *           type: string
 *           example: "Anytown"
 *         stateProvinceRegion:
 *           type: string
 *           example: "CA"
 *         postalCode:
 *           type: string
 *           example: "90210"
 *         country:
 *           type: string
 *           example: "US" # ISO 3166-1 alpha-2 code
 *         addressType:
 *           type: string
 *           enum: [shipping, billing] # Buyers typically manage shipping/billing
 *           example: "shipping"
 *         contactName:
 *           type: string
 *           nullable: true
 *           example: "Jane Doe"
 *         contactPhone:
 *           type: string
 *           nullable: true
 *           example: "+15551234567"
 *         isDefaultShipping:
 *           type: boolean
 *           default: false
 *         isDefaultBilling:
 *           type: boolean
 *           default: false
 *     AddressResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/AddressInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             userId:
 *               type: string
 *               format: uuid
 *             createdAt:
 *               type: string
 *               format: "date-time"
 *             updatedAt:
 *               type: string
 *               format: "date-time"
 */

export const addressInputBaseSchema = z.object({
	addressLine1: z.string().trim().min(1, "Address line 1 is required"),
	addressLine2: z.string().trim().nullable().optional(),
	city: z.string().trim().min(1, "City is required"),
	stateProvinceRegion: z
		.string()
		.trim()
		.min(1, "State/Province/Region is required"),
	postalCode: z.string().trim().min(1, "Postal code is required"),
	country: z
		.string()
		.trim()
		.length(2, "Country code must be 2 characters")
		.toUpperCase(), // ISO 3166-1 alpha-2
	addressType: z.enum(["shipping", "billing"], {
		required_error: "Address type is required",
	}),
	contactName: z.string().trim().nullable().optional(),
	contactPhone: z.string().trim().nullable().optional(), // Add more specific phone validation if needed
	isDefaultShipping: z.boolean().default(false).optional(),
	isDefaultBilling: z.boolean().default(false).optional(),
});

export const createAddressSchema = z.object({
	body: addressInputBaseSchema,
});

export const updateAddressSchema = z.object({
	params: z.object({
		addressId: objectIdSchema,
	}),
	body: addressInputBaseSchema.partial(), // All fields optional for update
});

export const getAddressParamsSchema = z.object({
	params: z.object({
		addressId: objectIdSchema,
	}),
});
