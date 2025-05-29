import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const sellerApplicationSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		userId: {
			// The user applying
			type: String,
			ref: "User",
			required: true,
			unique: true, // A user can only have one active application
			index: true,
		},
		proposedStoreName: {
			type: String,
			required: true,
			trim: true,
		},
		applicationDetails: {
			// Information provided by applicant (e.g., business type, experience)
			type: mongoose.Schema.Types.Mixed, // JSONB-like
			required: true,
		},
		documentUrls: {
			// URLs to supporting documents (e.g., business license)
			type: [String],
			default: [],
		},
		status: {
			type: String,
			enum: ["pending_review", "approved", "rejected", "requires_more_info"],
			default: "pending_review",
			index: true,
		},
		adminReviewerId: {
			// Admin who reviewed
			type: String,
			ref: "User",
		},
		reviewNotes: {
			// Notes from admin
			type: String,
			trim: true,
		},
		submittedAt: {
			type: Date,
			default: Date.now,
		},
		reviewedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// RDF Sync Placeholder
// sellerApplicationSchema.post('save', async function(doc, next) { /* ... */ next(); });
// sellerApplicationSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} SellerApplicationModelType
 * @type {SellerApplicationModelType}
 */
const SellerApplication = mongoose.model(
	"SellerApplication",
	sellerApplicationSchema,
);

export default SellerApplication;
