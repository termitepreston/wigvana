import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const reviewResponseSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    reviewId: {
      // The review being responded to
      type: String,
      ref: "Review",
      required: true,
      unique: true, // Only one response per review
      index: true,
    },
    sellerId: {
      // The seller who responded
      type: String,
      ref: "User", // Or 'SellerProfile'
      required: true,
      index: true,
    },
    responseText: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    id: false,
  },
);

// After saving a response, update the Review document to link to this response
reviewResponseSchema.post("save", async (doc, next) => {
  try {
    await mongoose
      .model("Review")
      .findByIdAndUpdate(doc.reviewId, { sellerResponseId: doc._id });
  } catch (error) {
    // logger.error('Failed to link review response to review:', error);
    console.error("Failed to link review response to review:", error);
  }
  next();
});
// Handle if response is deleted, to unlink from Review
reviewResponseSchema.post("remove", async (doc, next) => {
  try {
    await mongoose
      .model("Review")
      .findByIdAndUpdate(doc.reviewId, { $unset: { sellerResponseId: "" } });
  } catch (error) {
    // logger.error('Failed to unlink review response from review:', error);
    console.error("Failed to unlink review response from review:", error);
  }
  next();
});

// RDF Sync Placeholder
// reviewResponseSchema.post('save', async function(doc, next) { /* ... */ next(); });
// reviewResponseSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ReviewResponseModelType
 * @type {ReviewResponseModelType}
 */
const ReviewResponse = mongoose.model("ReviewResponse", reviewResponseSchema);

export default ReviewResponse;
