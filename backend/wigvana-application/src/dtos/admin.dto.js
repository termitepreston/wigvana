import { z } from "zod";
import {
  objectIdSchema,
  paginationQuerySchema,
  productSortBySchema,
  sortOrderSchema,
} from "./common.dto.js";
// We might reuse parts of user.dto.js, product.dto.js, category.dto.js

/**
 * @openapi
 * components:
 *   schemas:
 *     AdminUpdateUserInput: # For admin updating user details
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email: # Admins might be able to change emails, with verification reset
 *           type: string
 *           format: email
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [buyer, seller, admin]
 *         accountStatus:
 *           type: string
 *           enum: [active, suspended, pending_verification, deactivated]
 *         emailVerified:
 *           type: boolean
 *         # Seller specific flags if admin directly manages this
 *         # isVerifiedSeller: # This might be part of SellerProfile update by admin
 *         #   type: boolean
 *     AdminProductUpdateInput: # For admin updating any product
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         categoryId:
 *           type: string
 *           format: uuid
 *         isPublished:
 *           type: boolean
 *         approvalStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         isFeatured:
 *           type: boolean
 *         # Other fields admin can moderate
 *     AdminCategoryInput: # For admin creating/updating categories
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         slug: # Optional, can be auto-generated
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
 *         isActive:
 *           type: boolean
 *           default: true
 *         displayOrder:
 *           type: integer
 *           default: 0
 *     AdminUpdateOrderInput: # For admin updating any order status
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           # Admin can set a wider range of statuses
 *           enum: [pending_payment, payment_failed, processing, shipped, out_for_delivery, delivered, cancelled_by_user, cancelled_by_seller, cancelled_by_admin, refund_pending, refunded, completed, resolved_dispute]
 *         notes: # Admin notes on the order update
 *           type: string
 *           nullable: true
 *     AdminProcessRefundInput:
 *       type: object
 *       required:
 *         - amount
 *         - reason
 *       properties:
 *         amount:
 *           type: number
 *           format: float
 *           description: "Amount to refund. Can be partial or full."
 *         reason:
 *           type: string
 *           description: "Reason for the refund."
 *     AdminUpdateReviewStatusInput:
 *       type: object
 *       required:
 *         - status # e.g., isApproved, or a more granular status enum
 *       properties:
 *         isApproved: # Example, could be a status enum: 'approved', 'hidden', 'rejected'
 *           type: boolean
 *         reason: # Reason for moderation action
 *           type: string
 *           nullable: true
 *     AdminSellerApplicationActionInput: # For rejecting an application
 *        type: object
 *        required:
 *          - reason
 *        properties:
 *          reason:
 *            type: string
 *            minLength: 10
 *            description: "Reason for rejecting the seller application."
 */

// --- Admin User Management ---
export const listUsersQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      role: z
        .enum(["buyer", "seller", "admin", "all"])
        .default("all")
        .optional(),
      status: z
        .enum([
          "active",
          "suspended",
          "pending_verification",
          "deactivated",
          "all",
        ])
        .default("all")
        .optional(),
      search: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Search by email, first name, or last name"),
    })
    .strict(),
});

export const adminUpdateUserSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  body: z
    .object({
      firstName: z.string().trim().min(1).optional(),
      lastName: z.string().trim().min(1).optional(),
      email: z.string().email().optional(), // If admin changes email, re-verification flow should trigger
      roles: z
        .array(z.enum(["buyer", "seller", "admin"]))
        .min(1)
        .optional(),
      accountStatus: z
        .enum(["active", "suspended", "pending_verification", "deactivated"])
        .optional(),
      emailVerified: z.boolean().optional(),
      // Seller specific flags - these might be better managed via SellerProfile updates by admin
      // isVerifiedSeller: z.boolean().optional(), // This would likely update SellerProfile.verificationStatus
    })
    .strip()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const userIdParamsSchema = z.object({
  // Reused for get, suspend, unsuspend
  params: z.object({ userId: objectIdSchema }),
});

// --- Admin Seller Application Management ---
export const listSellerApplicationsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      status: z
        .enum([
          "pending_review",
          "approved",
          "rejected",
          "requires_more_info",
          "all",
        ])
        .default("all")
        .optional(),
      userId: objectIdSchema.optional(), // Filter by applicant's user ID
    })
    .strict(),
});

export const sellerApplicationIdParamsSchema = z.object({
  params: z.object({ applicationId: objectIdSchema }),
});

export const rejectSellerApplicationSchema = z.object({
  params: z.object({ applicationId: objectIdSchema }),
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(10, "Reason for rejection must be at least 10 characters."),
  }),
});

// --- Admin Product Management ---
export const listAdminProductsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      sellerId: objectIdSchema.optional(),
      categoryId: objectIdSchema.optional(),
      status: z
        .enum(["pending", "approved", "rejected", "all"])
        .default("all")
        .optional()
        .describe("Filter by approvalStatus"),
      isPublished: z
        .enum(["true", "false", "all"])
        .default("all")
        .optional()
        .transform((val) => (val === "all" ? undefined : val === "true")),
      search: z.string().trim().min(1).optional(),
      sort_by: productSortBySchema.optional(), // Reuse common product sort
      order: sortOrderSchema.optional(),
    })
    .strict(),
});

export const adminUpdateProductSchema = z.object({
  params: z.object({ productId: objectIdSchema }),
  body: z
    .object({
      // Define fields an admin can change
      name: z.string().trim().min(1).optional(),
      description: z.string().trim().min(1).optional(),
      categoryId: objectIdSchema.optional(),
      isPublished: z.boolean().optional(),
      approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      isFeatured: z.boolean().optional(),
      // Potentially tags, brand, etc.
    })
    .strip()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const productIdParamsSchema = z.object({
  // Reused
  params: z.object({ productId: objectIdSchema }),
});

// --- Admin Category Management ---
export const adminCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens",
    )
    .optional(),
  description: z.string().trim().min(1).nullable().optional(),
  parentId: objectIdSchema.nullable().optional(),
  imageUrl: z.string().url("Invalid image URL").nullable().optional(),
  isActive: z.boolean().default(true).optional(),
  displayOrder: z.coerce.number().int().default(0).optional(),
});

export const adminCreateCategorySchema = z.object({
  body: adminCategoryInputSchema,
});
export const adminUpdateCategorySchema = z.object({
  params: z.object({ categoryId: objectIdSchema }),
  body: adminCategoryInputSchema
    .partial()
    .strip()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});
export const categoryIdParamsSchema = z.object({
  // Reused
  params: z.object({ categoryId: objectIdSchema }),
});

// --- Admin Order Management ---
export const listAdminOrdersQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      userId: objectIdSchema.optional().describe("Filter by buyer's user ID."),
      sellerId: objectIdSchema
        .optional()
        .describe("Filter by seller's user ID (checks OrderItems)."),
      status: z.string().optional().describe("Filter by order status."),
      orderId: objectIdSchema
        .optional()
        .describe("Search by specific order ID."), // For direct lookup
      // Add date range filters, totalAmount range, etc.
    })
    .strict(),
});

export const adminUpdateOrderStatusSchema = z.object({
  params: z.object({ orderId: objectIdSchema }),
  body: z.object({
    status: z.enum(
      [
        "pending_payment",
        "payment_failed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled_by_user",
        "cancelled_by_seller",
        "cancelled_by_admin",
        "refund_pending",
        "refunded",
        "completed",
        "resolved_dispute",
      ],
      { required_error: "Status is required." },
    ),
    notes: z.string().trim().min(1).nullable().optional(),
  }),
});

export const adminProcessRefundSchema = z.object({
  params: z.object({ orderId: objectIdSchema }),
  body: z.object({
    amount: z.coerce.number().positive("Refund amount must be positive."),
    reason: z.string().trim().min(1, "Reason for refund is required."),
    // orderItemId: objectIdSchema.optional(), // For partial item refund
  }),
});
export const orderIdParamsSchema = z.object({
  // Reused
  params: z.object({ orderId: objectIdSchema }),
});

// --- Admin Review Management ---
export const listAdminReviewsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      userId: objectIdSchema.optional(),
      productId: objectIdSchema.optional(),
      isApproved: z
        .enum(["true", "false", "all"])
        .default("all")
        .optional()
        .transform((val) => (val === "all" ? undefined : val === "true")),
      rating: z.coerce.number().int().min(1).max(5).optional(),
    })
    .strict(),
});

export const adminUpdateReviewStatusSchema = z.object({
  params: z.object({ reviewId: objectIdSchema }),
  body: z.object({
    // isApproved is simpler for now, but a 'status' enum could be: 'approved', 'hidden', 'rejected_spam'
    isApproved: z.boolean({ required_error: "Approval status is required." }),
    reason: z.string().trim().min(1).nullable().optional(), // Reason for moderation
  }),
});
export const reviewIdParamsSchema = z.object({
  // Reused
  params: z.object({ reviewId: objectIdSchema }),
});
