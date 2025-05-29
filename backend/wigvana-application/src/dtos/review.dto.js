import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewInput:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: "Rating from 1 to 5."
 *         title:
 *           type: string
 *           nullable: true
 *           description: "Optional title for the review."
 *         comment:
 *           type: string
 *           nullable: true
 *           description: "Optional comment for the review."
 *     ReviewResponse: # This is the same as Product.dto.js's Review, can be reused or referenced
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
 *         rating:
 *           type: integer
 *         title:
 *           type: string
 *           nullable: true
 *         comment:
 *           type: string
 *           nullable: true
 *         isApproved:
 *           type: boolean
 *         # sellerResponseId:
 *         #   type: string
 *         #   format: uuid
 *         #   nullable: true
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedUserReviews: # Specific for /me/reviews
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewResponse'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     UpdateReviewInput:
 *       type: object
 *       properties:
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
 *     SellerReviewResponseInput:
 *       type: object
 *       required:
 *         - responseText
 *       properties:
 *         responseText:
 *           type: string
 *           minLength: 1
 *           example: "Thank you for your feedback! We're glad you enjoyed the product."
 *     ReviewResponseFull: # For showing seller response with review
 *       allOf:
 *         - $ref: '#/components/schemas/ReviewResponse' # The original review
 *         - type: object
 *           properties:
 *             sellerResponse:
 *               $ref: '#/components/schemas/ReviewResponseDetails' # Defined below
 *               nullable: true
 *     ReviewResponseDetails: # Details of the seller's response itself
 *        type: object
 *        properties:
 *          id:
 *            type: string
 *            format: uuid
 *          reviewId:
 *            type: string
 *            format: uuid
 *          sellerId:
 *            type: string
 *            format: uuid
 *          responseText:
 *            type: string
 *          createdAt:
 *            type: string
 *            format: "date-time"
 *          updatedAt:
 *            type: string
 *            format: "date-time"
 */

export const createReviewSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().min(1).max(255).nullable().optional(),
    comment: z.string().trim().min(1).nullable().optional(),
  }),
});

export const listMyReviewsQuerySchema = z.object({
  // For /me/reviews
  query: paginationQuerySchema
    .extend({
      productId: objectIdSchema
        .optional()
        .describe("Filter reviews by a specific product ID."),
      rating: z.coerce
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("Filter reviews by rating."),
    })
    .strict(),
});

export const reviewIdParamsSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema,
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema,
  }),
  body: z
    .object({
      rating: z.coerce.number().int().min(1).max(5).optional(),
      title: z.string().trim().min(1).max(255).nullable().optional(),
      comment: z.string().trim().min(1).nullable().optional(),
    })
    .strip()
    .refine((data) => Object.keys(data).length > 0, {
      message:
        "At least one field (rating, title, or comment) must be provided for update.",
    }),
});

export const respondToReviewSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema, // The ID of the review they are responding to
  }),
  body: z.object({
    responseText: z.string().trim().min(1, "Response text cannot be empty"),
  }),
});
