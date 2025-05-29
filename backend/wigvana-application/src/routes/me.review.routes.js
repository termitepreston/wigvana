import express from "express";
import { reviewController } from "../controllers/review.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listMyReviewsQuerySchema,
  reviewIdParamsSchema,
  updateReviewSchema,
} from "../dtos/review.dto.js";
import { respondToReviewSchema } from "../dtos/review.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["buyer"]));

/**
 * @openapi
 * tags:
 *   name: Buyer Reviews
 *   description: Management of authenticated buyer's own reviews.
 */

/**
 * @openapi
 * /me/reviews:
 *   get:
 *     summary: List buyer's own reviews
 *     tags: [Buyer Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *         description: Filter reviews by product ID.
 *       - in: query
 *         name: rating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *         description: Filter reviews by rating.
 *     responses:
 *       200:
 *         description: A paginated list of the buyer's reviews.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUserReviews'
 *       401:
 *         description: Unauthorized.
 */
router.get(
  "/",
  validate(listMyReviewsQuerySchema),
  reviewController.listMyReviews,
);

/**
 * @openapi
 * /me/reviews/{reviewId}:
 *   patch:
 *     summary: Update buyer's own review
 *     tags: [Buyer Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathReviewId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewInput'
 *     responses:
 *       200:
 *         description: Review updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (e.g., review cannot be updated).
 *       404:
 *         description: Review not found.
 */
router.patch(
  "/:reviewId",
  validate(updateReviewSchema),
  reviewController.updateMyReview,
);

/**
 * @openapi
 * /me/reviews/{reviewId}:
 *   delete:
 *     summary: Delete buyer's own review
 *     tags: [Buyer Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathReviewId'
 *     responses:
 *       204:
 *         description: Review deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Review not found.
 */
router.delete(
  "/:reviewId",
  validate(reviewIdParamsSchema),
  reviewController.deleteMyReview,
);

// --- Seller Review Interaction ---
/**
 * @openapi
 * /me/reviews/{reviewId}/respond:
 *   post:
 *     summary: (Seller) Respond to a review on one of their products
 *     tags: [Seller Review Interaction] # New Tag
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathReviewId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerReviewResponseInput'
 *     responses:
 *       201:
 *         description: Response posted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponseDetails' # The seller's response object
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden (not seller, or review not on their product).
 *       404: Review not found.
 *       409: Conflict (already responded).
 */
router.post(
  "/:reviewId/respond", // This will be /me/reviews/:reviewId/respond
  protect,
  authorize(["seller"]), // Ensure only sellers can use this
  validate(respondToReviewSchema),
  reviewController.respondToProductReview,
);

export default router;
