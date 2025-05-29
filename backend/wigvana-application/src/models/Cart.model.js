import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const cartSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		userId: {
			type: String,
			ref: "User",

			index: true,
		},
		anonymousCartToken: {
			// For anonymous carts, client manages sending this
			type: String,

			index: true, // Consider unique index if this is the sole ID for anon carts
			// or manage uniqueness at application level.
		},
		status: {
			type: String,
			enum: ["active", "merged", "abandoned", "completed"],
			default: "active",
			index: true,
		},
		// CartItems will be a separate collection referencing this Cart's ID
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// Ensure that for anonymous carts, anonymousCartToken is present,
// and for user carts, userId is present. This can be enforced by application logic or complex validators.
// Example for unique anonymousCartToken if it's truly unique:
// cartSchema.index({ anonymousCartToken: 1 }, { unique: true, partialFilterExpression: { userId: null } });

// RDF Sync Placeholder
// cartSchema.post('save', async function(doc, next) { /* ... */ next(); });
// cartSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} CartModelType
 * @type {CartModelType}
 */
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
