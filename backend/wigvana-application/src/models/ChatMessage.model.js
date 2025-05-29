import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const chatMessageSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		conversationId: {
			type: String,
			ref: "Conversation",
			required: true,
			index: true,
		},
		senderId: {
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		receiverId: {
			// Denormalized for easier querying of messages for a user
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		messageText: {
			type: String, // Text, can be large
			required: true,
		},
		messageType: {
			type: String,
			enum: ["text", "image_url", "product_link", "order_link"],
			default: "text",
		},
		sentAt: {
			// `createdAt` from timestamps can also serve this purpose
			type: Date,
			default: Date.now,
			index: true,
		},
		readAt: {
			type: Date,
		},
	},
	{
		timestamps: true, // createdAt will be very close to sentAt
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// RDF Sync Placeholder
// chatMessageSchema.post('save', async function(doc, next) { /* ... */ next(); });
// chatMessageSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ChatMessageModelType
 * @type {ChatMessageModelType}
 */
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
