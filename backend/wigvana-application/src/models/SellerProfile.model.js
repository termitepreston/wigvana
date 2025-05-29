import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const sellerProfileSchema = new mongoose.Schema(
	{
		_id: {
			// This could also be the same as userId if it's a strict 1-to-1 extension
			type: String,
			default: () => uuidv4(),
		},
		userId: {
			// Links to the User entity
			type: String,
			ref: "User",
			required: true,
			unique: true, // Each user can have only one seller profile
			index: true,
		},
		storeName: {
			type: String,
			required: true,
			unique: true, // Store name should be unique
			trim: true,
			index: true,
		},
		storeDescription: {
			type: String, // Text
			trim: true,
		},
		storeLogoUrl: {
			type: String,
			trim: true,
		},
		storeBannerUrl: {
			type: String,
			trim: true,
		},
		businessAddressId: {
			type: String,
			ref: "Address",
		},
		businessEmail: {
			type: String,
			trim: true,
			lowercase: true,
		},
		businessPhoneNumber: {
			type: String,
			trim: true,
		},
		taxId: {
			// e.g., VAT ID
			type: String,
			trim: true,
		},
		verificationStatus: {
			type: String,
			enum: ["not_applied", "pending", "approved", "rejected"],
			default: "not_applied", // This might change upon creation via seller application
			index: true,
		},
		payoutDetailsToken: {
			// Tokenized bank account/payout info from payment provider
			type: String,
			trim: true,

			private: true, // Mark as private
		},
		joinedAsSellerAt: {
			type: Date,
			default: Date.now, // Or set when verificationStatus becomes 'approved'
		},
	},
	{
		timestamps: true,
		toJSON: {
			getters: true,
			virtuals: true,
			transform: (doc, ret) => {
				// Example to remove private fields
				ret.payoutDetailsToken = undefined;
				return ret;
			},
		},
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// RDF Sync Placeholder
// sellerProfileSchema.post('save', async function(doc, next) { /* ... */ next(); });
// sellerProfileSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} SellerProfileModelType
 * @type {SellerProfileModelType}
 */
const SellerProfile = mongoose.model("SellerProfile", sellerProfileSchema);

export default SellerProfile;
