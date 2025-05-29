import httpStatusCodes from "http-status-codes";
import { reviewService } from "../services/review.service.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";

/**
 * Controller for a buyer to write a review for a product.
 * Mounted under /products/:productId/reviews
 * @type {import('express').RequestHandler}
 */
const writeProductReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(
    req.user.id,
    req.params.productId,
    req.body,
  );
  res.status(httpStatusCodes.CREATED).send(review);
});

/**
 * Controller to list buyer's own reviews.
 * Mounted under /me/reviews
 * @type {import('express').RequestHandler}
 */
const listMyReviews = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, [
    "page",
    "limit",
    "productId",
    "rating",
  ]);
  const result = await reviewService.listMyReviews(req.user.id, queryOptions);
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller for a buyer to update their own review.
 * Mounted under /me/reviews/:reviewId
 * @type {import('express').RequestHandler}
 */
const updateMyReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateMyReview(
    req.user.id,
    req.params.reviewId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(review);
});

/**
 * Controller for a buyer to delete their own review.
 * Mounted under /me/reviews/:reviewId
 * @type {import('express').RequestHandler}
 */
const deleteMyReview = catchAsync(async (req, res) => {
  await reviewService.deleteMyReview(req.user.id, req.params.reviewId);
  res.status(httpStatusCodes.NO_CONTENT).send();
});

/**
 * Controller for a seller to respond to a review on one of their products.
 * Mounted under /me/reviews/:reviewId/respond (or similar)
 * @type {import('express').RequestHandler}
 */
const respondToProductReview = catchAsync(async (req, res) => {
  const reviewResponse = await reviewService.respondToReview(
    req.user.id,
    req.params.reviewId,
    req.body.responseText,
  );
  res.status(httpStatusCodes.CREATED).send(reviewResponse);
});

export const reviewController = {
  writeProductReview,
  listMyReviews,
  updateMyReview,
  deleteMyReview,
  respondToProductReview,
};
