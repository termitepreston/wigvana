import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const conversationSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		buyerId: {
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		sellerId: {
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		productId: {
			// Context for the conversation
			type: String,
			ref: "Product",

			index: true,
		},
		orderId: {
			// Context for the conversation
			type: String,
			ref: "Order",

			index: true,
		},
		lastMessageSnippet: {
			type: String,
			trim: true,
			maxlength: 200, // Keep it short
		},
		lastMessageAt: {
			type: Date,

			index: true,
		},
		buyerUnreadCount: {
			type: Number,
			default: 0,
			min: 0,
		},
		sellerUnreadCount: {
			type: Number,
			default: 0,
			min: 0,
		},
		statusByBuyer: {
			type: String,
			enum: ["active", "archived"],
			default: "active",
		},
		statusBySeller: {
			type: String,
			enum: ["active", "archived"],
			default: "active",
		},
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// Index for finding conversations between two users, potentially for a specific product/order
conversationSchema.index({ buyerId: 1, sellerId: 1, productId: 1 });
conversationSchema.index({ buyerId: 1, sellerId: 1, orderId: 1 });

// RDF Sync Placeholder
// conversationSchema.post('save', async function(doc, next) { /* ... */ next(); });
// conversationSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ConversationModelType
 * @type {ConversationModelType}
 */
const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
