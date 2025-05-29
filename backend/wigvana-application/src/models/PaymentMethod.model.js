import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const paymentMethodSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		userId: {
			type: String,
			ref: "User",
			required: true,
			index: true,
		},
		paymentGateway: {
			// e.g., "stripe", "paypal"
			type: String,
			enum: ["stripe", "paypal", "braintree", "custom"], // Add more as needed
			required: true,
		},
		type: {
			// e.g., "Card", "PayPalAccount"
			type: String,
			required: true,
		},
		paymentGatewayToken: {
			// The token from the payment provider (e.g., Stripe payment_method_id)
			type: String,
			required: true,
			unique: true, // A specific token should ideally be unique
		},
		cardBrand: {
			// e.g., "Visa", "Mastercard"
			type: String,
			trim: true,
		},
		lastFourDigits: {
			type: String,
			trim: true,
		},
		expirationMonth: {
			type: Number,

			min: 1,
			max: 12,
		},
		expirationYear: {
			type: Number,
		},
		billingAddressId: {
			// Optional: link to a specific billing address from user's addresses
			type: String,
			ref: "Address",
		},
		isDefault: {
			type: Boolean,
			default: false,
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
// paymentMethodSchema.post('save', async function(doc, next) { /* ... */ next(); });
// paymentMethodSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} PaymentMethodModelType
 * @type {PaymentMethodModelType}
 */
const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
