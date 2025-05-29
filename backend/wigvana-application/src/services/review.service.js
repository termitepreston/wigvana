import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js"; // To verify purchase
import OrderItem from "../models/OrderItem.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";
import ReviewResponse from "../models/ReviewResponse.model.js";

/**
 * Creates a new review for a product by a buyer.
 * Verifies if the buyer purchased the product.
 * @param {string} userId - The ID of the buyer.
 * @param {string} productId - The ID of the product to review.
 * @param {typeof import('../dtos/review.dto.js').createReviewSchema._input.body} reviewData - Review details.
 * @returns {Promise<InstanceType<typeof Review>>} The created review document.
 */
const createReview = async (userId, productId, reviewData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
  }

  // Check if user has already reviewed this product
  const existingReview = await Review.findOne({ userId, productId });
  if (existingReview) {
    throw new ApiError(
      httpStatusCodes.CONFLICT,
      "You have already reviewed this product.",
    );
  }

  // Policy: Verify if the user has purchased this product.
  // This requires checking past orders.
  const purchasedOrder = await Order.findOne({
    userId,
    status: { $in: ["delivered", "completed"] }, // Or other relevant statuses indicating purchase completion
    "items.productId": productId, // Check if an order item matches the productId (requires Order.items to be populated or a direct query on OrderItem)
  }).populate({
    // This populate might be too broad if you only need existence check
    path: "items",
    model: OrderItem,
    match: { productId: productId },
  });

  // More efficient check:
  const hasPurchased = await OrderItem.exists({
    productId,
    // We need to link OrderItem back to an Order by `userId` and appropriate `status`
    // This requires a more complex query or denormalization.
    // For simplicity, we'll assume a simpler check for now or require orderId with review.
    // If OrderItem model had a `buyerId` field (denormalized from Order), it would be easier.
  });
  // Let's refine the purchase check:
  const ordersWithProduct = await Order.find({
    userId,
    status: { $in: ["delivered", "completed"] },
  }).select("_id");
  const orderIds = ordersWithProduct.map((o) => o._id);
  const verifiedPurchaseOrderItem = await OrderItem.findOne({
    orderId: { $in: orderIds },
    productId,
  });

  if (!verifiedPurchaseOrderItem) {
    throw new ApiError(
      httpStatusCodes.FORBIDDEN,
      "You can only review products you have purchased and received.",
    );
  }

  const review = await Review.create({
    ...reviewData,
    userId,
    productId,
    orderId: verifiedPurchaseOrderItem.orderId, // Link to the order for verification
    isApproved: true, // Or false if admin moderation is enabled by default
  });

  // The Review model's post-save hook will update product.averageRating and product.reviewCount
  return review;
};

/**
 * Lists reviews submitted by the authenticated buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {typeof import('../dtos/review.dto.js').listMyReviewsQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<{results: Array<InstanceType<typeof Review>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated reviews.
 */
const listMyReviews = async (userId, queryOptions) => {
  const { page, limit, productId, rating } = queryOptions;
  const filter = { userId };

  if (productId) {
    filter.productId = productId;
  }
  if (rating) {
    filter.rating = rating;
  }

  const skip = (page - 1) * limit;
  const reviews = await Review.find(filter)
    .populate("productId", "name slug imageUrl") // Populate product info for context
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Review.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: reviews,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Updates a review written by the buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} reviewId - The ID of the review to update.
 * @param {typeof import('../dtos/review.dto.js').updateReviewSchema._input.body} updateData - Data to update.
 * @returns {Promise<InstanceType<typeof Review>>} The updated review document.
 */
const updateMyReview = async (userId, reviewId, updateData) => {
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Review not found or you are not the author.",
    );
  }

  // Policy: Allow updates within a certain timeframe or if not yet responded to by seller (example)
  // const canUpdate = (Date.now() - new Date(review.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
  // if (!canUpdate) {
  //   throw new ApiError(httpStatusCodes.FORBIDDEN, "Review can no longer be updated.");
  // }

  Object.assign(review, updateData);
  review.isApproved = true; // Or re-set to pending if updates require moderation

  await review.save();
  // The Review model's post-save hook will re-calculate product.averageRating
  return review;
};

/**
 * Deletes a review written by the buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} reviewId - The ID of the review to delete.
 * @returns {Promise<void>}
 */
const deleteMyReview = async (userId, reviewId) => {
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Review not found or you are not the author.",
    );
  }

  // Policy: Allow deletion if not responded to by seller (example)
  // if (review.sellerResponseId) {
  //   throw new ApiError(httpStatusCodes.FORBIDDEN, "Cannot delete a review that has a seller response.");
  // }
  const productId = review.productId; // Store before delete for rating update
  await review.deleteOne();

  // Manually trigger rating recalculation if using 'deleteOne' and post 'remove' hook is not for it
  // Or ensure your post 'remove' hook on Review schema handles this with findOneAndDelete
  await Review.calculateAverageRating(productId); // Call static method
};

/**
 * Allows a seller to respond to a review on one of their products.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} reviewId - The ID of the review.
 * @param {string} responseText - The text of the seller's response.
 * @returns {Promise<InstanceType<typeof ReviewResponse>>} The created review response.
 */
const respondToReview = async (sellerId, reviewId, responseText) => {
  const review = await Review.findById(reviewId).populate("productId");
  if (!review) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Review not found.");
  }

  // Check if the product belongs to this seller
  if (!review.productId || review.productId.sellerId.toString() !== sellerId) {
    throw new ApiError(
      httpStatusCodes.FORBIDDEN,
      "You can only respond to reviews on your own products.",
    );
  }

  // Check if already responded
  if (review.sellerResponseId) {
    // Option 1: Allow updating existing response
    // const existingResponse = await ReviewResponse.findById(review.sellerResponseId);
    // if (existingResponse) {
    //     existingResponse.responseText = responseText;
    //     await existingResponse.save();
    //     return existingResponse;
    // }
    // Option 2: Disallow responding more than once
    throw new ApiError(
      httpStatusCodes.CONFLICT,
      "A response to this review already exists.",
    );
  }

  const reviewResponse = await ReviewResponse.create({
    reviewId,
    sellerId,
    responseText,
  });

  // Link this response back to the review (ReviewResponse model's post-save hook handles this)
  // review.sellerResponseId = reviewResponse._id;
  // await review.save(); // Not needed if ReviewResponse hook does it.

  // TODO: Notify the user who wrote the review about the seller's response.
  // await notificationService.sendSellerResponseNotification(review.userId.email, review, reviewResponse);

  return reviewResponse;
};

/**
 * (Admin) Lists all reviews on the platform.
 * @param {typeof import('../dtos/admin.dto.js').listAdminReviewsQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<Object>} Paginated reviews.
 */
const listAllPlatformReviews = async (queryOptions) => {
  const { page, limit, userId, productId, isApproved, rating } = queryOptions;
  const filter = {};

  if (userId) filter.userId = userId;
  if (productId) filter.productId = productId;
  if (isApproved !== undefined) filter.isApproved = isApproved;
  if (rating) filter.rating = rating;

  const skip = (page - 1) * limit;
  const reviews = await Review.find(filter)
    .populate("userId", "firstName lastName email")
    .populate("productId", "name slug")
    .populate({
      path: "sellerResponseId",
      model: ReviewResponse,
      populate: { path: "sellerId", select: "firstName lastName" },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Review.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  return { results: reviews, page, limit, totalPages, totalResults };
};

/**
 * (Admin) Moderates/Deletes a review.
 * @param {string} reviewId - ID of the review.
 * @returns {Promise<void>}
 */
const adminDeleteReview = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Review not found.");

  const productId = review.productId;
  // If review has a seller response, delete that too or handle orphan
  if (review.sellerResponseId) {
    await ReviewResponse.findByIdAndDelete(review.sellerResponseId);
  }
  await review.deleteOne();
  await Review.calculateAverageRating(productId); // Recalculate product rating
};

/**
 * (Admin) Updates review status (e.g., approve, hide).
 * @param {string} reviewId - ID of the review.
 * @param {typeof import('../dtos/admin.dto.js').adminUpdateReviewStatusSchema._input.body} statusData - Data.
 * @returns {Promise<InstanceType<typeof Review>>} Updated review.
 */
const adminUpdateReviewStatus = async (reviewId, statusData) => {
  const review = await Review.findById(reviewId);
  if (!review)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Review not found.");

  const oldApprovedStatus = review.isApproved;
  review.isApproved = statusData.isApproved;
  // review.moderationReason = statusData.reason; // Add a field for this if needed
  await review.save();

  // If approval status changed, recalculate product rating
  if (oldApprovedStatus !== review.isApproved) {
    await Review.calculateAverageRating(review.productId);
  }
  return review;
};

export const reviewService = {
  createReview,
  listMyReviews,
  updateMyReview,
  deleteMyReview,
  respondToReview,
  listAllPlatformReviews,
  adminDeleteReview,
  adminUpdateReviewStatus,
};
