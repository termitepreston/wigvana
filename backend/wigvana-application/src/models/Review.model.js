import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder
// import Product from './Product.model.js'; // For updating averageRating

const reviewSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		productId: {
			type: String,
			ref: "Product",
			required: true,
			index: true,
		},
		userId: {
			// The user who wrote the review
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		orderId: {
			// To link the review to a verified purchase
			type: String,
			ref: "Order",
			// Review might not always be tied to an order (e.g. admin seeded)
			index: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		title: {
			type: String,
			trim: true,
		},
		comment: {
			type: String,
			trim: true,
		},
		isApproved: {
			// Admin approval status
			type: Boolean,
			default: true, // Or false if moderation is needed by default
			index: true,
		},
		sellerResponseId: {
			// Link to a seller's response
			type: String,
			ref: "ReviewResponse",
		},
		helpfulVotes: {
			type: Number,
			default: 0,
		},
		unhelpfulVotes: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// Ensure a user can review a product only once (if desired)
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Static method to calculate and update average rating on Product
reviewSchema.statics.calculateAverageRating = async function (productId) {
	const stats = await this.aggregate([
		{ $match: { productId: productId, isApproved: true } },
		{
			$group: {
				_id: "$productId",
				averageRating: { $avg: "$rating" },
				reviewCount: { $sum: 1 },
			},
		},
	]);

	try {
		if (stats.length > 0) {
			await mongoose.model("Product").findByIdAndUpdate(productId, {
				averageRating: stats[0].averageRating.toFixed(1), // Round to one decimal
				reviewCount: stats[0].reviewCount,
			});
		} else {
			// No reviews or no approved reviews, reset product rating
			await mongoose.model("Product").findByIdAndUpdate(productId, {
				averageRating: 0,
				reviewCount: 0,
			});
		}
	} catch (err) {
		console.error("Error updating product average rating:", err);
	}
};

// Update product average rating after saving or removing a review
reviewSchema.post("save", function () {
	this.constructor.calculateAverageRating(this.productId);
});

reviewSchema.post("remove", function () {
	// Mongoose 5.x 'remove'
	this.constructor.calculateAverageRating(this.productId);
});
// For Mongoose 6+ 'deleteOne' or 'findOneAndDelete', use different hook or handle in service

// RDF Sync Placeholder
// reviewSchema.post('save', async function(doc, next) { /* ... */ next(); });
// reviewSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {calculateAverageRating: Function}> & {calculateAverageRating: Function}} ReviewModelType
 * @type {ReviewModelType}
 */
const Review = mongoose.model("Review", reviewSchema);

export default Review;
