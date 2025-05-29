import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const productImageSchema = new mongoose.Schema(
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
		imageUrl: {
			type: String,
			required: true,
			trim: true,
		},
		altText: {
			type: String,
			trim: true,
		},
		isCover: {
			// Indicates if this is the primary display image for the product
			type: Boolean,
			default: false,
			index: true,
		},
		displayOrder: {
			// For sorting product images
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

// RDF Sync Placeholder
// productImageSchema.post('save', async function(doc, next) { /* ... */ next(); });
// productImageSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ProductImageModelType
 * @type {ProductImageModelType}
 */
const ProductImage = mongoose.model("ProductImage", productImageSchema);

export default ProductImage;
