import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const orderSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		userId: {
			// The buyer
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		orderDate: {
			type: Date,
			default: Date.now,
			index: true,
		},
		status: {
			type: String,
			enum: [
				"pending_payment",
				"payment_failed",
				"processing",
				"shipped",
				"out_for_delivery",
				"delivered",
				"cancelled_by_user",
				"cancelled_by_seller",
				"cancelled_by_admin",
				"refund_pending",
				"refunded",
				"completed",
			],
			required: true,
			default: "pending_payment",
			index: true,
		},
		shippingAddressSnapshot: {
			// Snapshot of Address object
			type: mongoose.Schema.Types.Mixed,
			required: true,
		},
		billingAddressSnapshot: {
			// Snapshot of Address object
			type: mongoose.Schema.Types.Mixed,
			required: true,
		},
		paymentMethodDetailsSnapshot: {
			// Snapshot of payment method used
			type: mongoose.Schema.Types.Mixed,
			required: true,
		},
		paymentGatewayTransactionId: {
			type: String,
			trim: true,

			index: true,
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded"],
			default: "pending",
			index: true,
		},
		subtotalAmount: {
			// Sum of (item price * quantity) before discounts, shipping, taxes
			type: Number, // Consider Decimal128 for currency
			required: true,
		},
		discountCode: {
			type: String,
			trim: true,
		},
		discountAmount: {
			type: Number, // Consider Decimal128 for currency
			default: 0.0,
		},
		shippingMethod: {
			type: String,
			trim: true,
		},
		shippingCost: {
			type: Number, // Consider Decimal128 for currency
			default: 0.0,
		},
		taxAmount: {
			type: Number, // Consider Decimal128 for currency
			default: 0.0,
		},
		totalAmount: {
			// Final amount charged
			type: Number, // Consider Decimal128 for currency
			required: true,
		},
		currency: {
			// e.g., "USD"
			type: String,
			required: true,
			default: "USD",
		},
		trackingNumber: {
			type: String,
			trim: true,
		},
		carrier: {
			type: String,
			trim: true,
		},
		estimatedDeliveryDate: {
			type: Date,
		},
		notesByBuyer: {
			type: String,
			trim: true,
		},
		internalNotes: {
			// For seller/admin
			type: String,
			trim: true,
		},
		// OrderItems will be a separate collection referencing this Order's ID
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// RDF Sync Placeholder
// orderSchema.post('save', async function(doc, next) { /* ... */ next(); });
// orderSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} OrderModelType
 * @type {OrderModelType}
 */
const Order = mongoose.model("Order", orderSchema);

export default Order;
