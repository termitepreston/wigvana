import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const productVariantSchema = new mongoose.Schema(
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
		sku: {
			// Stock Keeping Unit
			type: String,
			required: true,
			unique: true, // SKU should be unique across all variants
			trim: true,
			index: true,
		},
		attributes: {
			// e.g., {"color": "Red", "size": "M"}
			type: mongoose.Schema.Types.Mixed, // JSONB-like
			required: true,
		},
		price: {
			// Price for this specific variant
			type: Number, // Consider Decimal128 for currency
			required: true,
		},
		salePrice: {
			type: Number, // Consider Decimal128 for currency
		},
		saleStartDate: {
			type: Date,
		},
		saleEndDate: {
			type: Date,
		},
		stockQuantity: {
			type: Number,
			default: 0,
			min: 0,
		},
		imageIds: [
			{
				// Specific images for this variant, references ProductImage _id
				type: String,
				ref: "ProductImage",
			},
		],
		weight: {
			// Weight if different from base product
			value: Number,
			unit: String, // e.g., 'kg', 'lb'
		},
		dimensions: {
			// Dimensions if different from base product
			length: Number,
			width: Number,
			height: Number,
			unit: String, // e.g., 'cm', 'in'

			type: mongoose.Schema.Types.Mixed, // To allow structure or null
		},
		isActive: {
			// Whether this variant is available for purchase
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// Index to ensure attributes are unique per product (e.g., no two "Red, M" for same product)
// This is complex to enforce with mongoose.Schema.Types.Mixed directly in an index.
// Usually handled at application layer or by ensuring a consistent string representation of attributes.
// For example: productVariantSchema.index({ productId: 1, attributesHash: 1 }, { unique: true });
// where attributesHash is a deterministically generated hash of the attributes object.

// RDF Sync Placeholder
// productVariantSchema.post('save', async function(doc, next) { /* ... */ next(); });
// productVariantSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ProductVariantModelType
 * @type {ProductVariantModelType}
 */
const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
