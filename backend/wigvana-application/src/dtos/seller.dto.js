import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "./common.dto.js"; // Assuming common.dto.js exists

/**
 * @openapi
 * components:
 *   schemas:
 *     SellerApplicationInput:
 *       type: object
 *       required:
 *         - proposedStoreName
 *         - applicationDetails
 *       properties:
 *         proposedStoreName:
 *           type: string
 *           minLength: 3
 *           example: "My Awesome Goods"
 *         applicationDetails:
 *           type: object # Or string if it's just text
 *           description: "Details about the seller's business, experience, etc."
 *           example: { businessType: "sole_proprietor", experienceYears: 2 }
 *         documentUrls:
 *           type: array
 *           items:
 *             type: string
 *             format: url
 *           nullable: true
 *           description: "URLs to supporting documents (e.g., business license)."
 *     SellerApplicationResponse: # What an admin might see or a user gets as confirmation
 *       allOf:
 *         - $ref: '#/components/schemas/SellerApplicationInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             userId:
 *               type: string
 *               format: uuid
 *             status:
 *               type: string
 *               enum: [pending_review, approved, rejected, requires_more_info]
 *             submittedAt:
 *               type: string
 *               format: "date-time"
 *             reviewedAt:
 *               type: string
 *               format: "date-time"
 *               nullable: true
 *     StoreProfileInput:
 *       type: object
 *       required:
 *         - storeName
 *       properties:
 *         storeName:
 *           type: string
 *           minLength: 3
 *           example: "The Gadget Emporium"
 *         storeDescription:
 *           type: string
 *           nullable: true
 *           example: "Your one-stop shop for the latest gadgets."
 *         storeLogoUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *         storeBannerUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *         businessAddressId:
 *           type: string
 *           format: uuid
 *           nullable: true # Seller might add this later
 *         businessEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *         businessPhoneNumber:
 *           type: string
 *           nullable: true
 *         taxId:
 *           type: string
 *           nullable: true
 *     StoreProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/StoreProfileInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid # ID of the SellerProfile document
 *             userId:
 *               type: string
 *               format: uuid # ID of the User document
 *             verificationStatus:
 *               type: string
 *               enum: [not_applied, pending, approved, rejected]
 *             joinedAsSellerAt:
 *               type: string
 *               format: "date-time"
 *             createdAt:
 *               type: string
 *               format: "date-time"
 *             updatedAt:
 *               type: string
 *               format: "date-time"
 */

export const sellerApplicationSchema = z.object({
  body: z.object({
    proposedStoreName: z
      .string()
      .trim()
      .min(3, "Proposed store name must be at least 3 characters long"),
    applicationDetails: z.any(), // Can be z.object with specific fields or z.string()
    documentUrls: z
      .array(z.string().url("Invalid document URL"))
      .optional()
      .nullable(),
  }),
});

export const storeProfileInputSchema = z.object({
  body: z
    .object({
      storeName: z
        .string()
        .trim()
        .min(3, "Store name must be at least 3 characters long"),
      storeDescription: z.string().trim().min(1).nullable().optional(),
      storeLogoUrl: z.string().url("Invalid logo URL").nullable().optional(),
      storeBannerUrl: z
        .string()
        .url("Invalid banner URL")
        .nullable()
        .optional(),
      businessAddressId: objectIdSchema.nullable().optional(),
      businessEmail: z
        .string()
        .email("Invalid business email")
        .nullable()
        .optional(),
      businessPhoneNumber: z.string().trim().min(1).nullable().optional(), // Add more specific phone validation if needed
      taxId: z.string().trim().min(1).nullable().optional(),
    })
    .strip(),
});
