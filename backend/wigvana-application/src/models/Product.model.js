import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { RDFConverter } from "../utils/RDFConverter.js"; // Import
import { rdfStoreService } from "../services/RDFStoreService.js"; // Import
import logger from "../utils/logger.js"; // Import
import config from "../config/index.js"; // For

const DATA_BASE_URI = `${config.APP_BASE_URI || "http://localhost:3000"}/data/`;

const productSchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		sellerId: {
			type: String,
			ref: "User", // Or 'SellerProfile' if you have a distinct ID there
			required: true,
			index: true,
		},
		categoryId: {
			type: String,
			ref: "Category",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			index: "text", // For text search capabilities
		},
		slug: {
			type: String,
			required: true,
			unique: true, // Assuming slugs are globally unique. Adjust if per-seller.
			trim: true,
			lowercase: true,
			index: true,
		},
		description: {
			type: String, // Supports rich text (store HTML or Markdown)
			required: true,
			trim: true,
		},
		brand: {
			type: String,
			trim: true,

			index: true,
		},
		basePrice: {
			// Standard price, may be overridden by variants
			type: Number, // Consider Decimal128 for currency
			required: true,
		},
		currency: {
			// e.g., "USD"
			type: String,
			required: true,
			default: "USD",
		},
		tags: {
			type: [String],
			index: true,
			default: [],
		},
		isFeatured: {
			type: Boolean,
			default: false,
			index: true,
		},
		isPublished: {
			// Whether the product is visible in the store
			type: Boolean,
			default: true, // Or false if requires review first
			index: true,
		},
		approvalStatus: {
			// Admin approval status
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending", // Or 'approved' if no admin review needed by default
			index: true,
		},
		averageRating: {
			type: Number,
			default: 0.0,
			min: 0,
			max: 5,
		},
		reviewCount: {
			type: Number,
			default: 0,
			min: 0,
		},
		shippingDetails: {
			// Object containing weight, dimensions
			weight: { value: Number, unit: String }, // e.g. { value: 1.5, unit: 'kg' }
			dimensions: {
				length: Number,
				width: Number,
				height: Number,
				unit: String,
			}, // e.g. { length: 10, ..., unit: 'cm' }
			shippingClass: String,
			type: mongoose.Schema.Types.Mixed,
		},
		// ProductImages and ProductVariants will be separate collections linking to this Product
	},
	{
		timestamps: true,
		toJSON: { getters: true, virtuals: true },
		toObject: { getters: true, virtuals: true },
		id: false,
	},
);

// Pre-save hook to generate slug from name if not provided
productSchema.pre("save", function (next) {
	if (this.isModified("name") && !this.slug) {
		this.slug = this.name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "");
		// Add a unique suffix if slug already exists (more complex logic needed here in a robust system)
	}
	next();
});

// RDF Sync: Save/Update
productSchema.post("save", async (doc, next) => {
	if (!rdfStoreService.isConfigured) {
		logger.debug(
			"[Product Model] RDF sync skipped: RDFStoreService not configured.",
		);
		return next();
	}
	try {
		const productURI = `${DATA_BASE_URI}product/${doc.id}`;
		await rdfStoreService.deleteTriplesForSubject(productURI); // Delete old state first for simplicity

		const nTriplesString = await RDFConverter.ProductToTriples(doc);
		if (nTriplesString) {
			await rdfStoreService.insertTriples(nTriplesString);
			logger.info(`[Product Model] RDF synced for product ID: ${doc.id}`);
		} else {
			logger.warn(
				`[Product Model] Failed to generate RDF for product ID: ${doc.id}. Sync skipped.`,
			);
		}
	} catch (error) {
		logger.error(
			`[Product Model] Error syncing product ID ${doc.id} to RDF store after save:`,
			error,
		);
	}
	next();
});

// RDF Sync: Delete
productSchema.post("remove", async (doc, next) => {
	// Or findOneAndDelete
	if (!rdfStoreService.isConfigured) {
		logger.debug(
			"[Product Model] RDF delete sync skipped: RDFStoreService not configured.",
		);
		return next();
	}
	try {
		const productURI = `${DATA_BASE_URI}product/${doc.id}`;
		await rdfStoreService.deleteTriplesForSubject(productURI);
		logger.info(`[Product Model] RDF deleted for product ID: ${doc.id}`);
	} catch (error) {
		logger.error(
			`[Product Model] Error deleting product ID ${doc.id} from RDF store:`,
			error,
		);
	}
	next();
});

productSchema.post("findOneAndDelete", async (doc, next) => {
	if (doc && rdfStoreService.isConfigured) {
		try {
			const productURI = `${DATA_BASE_URI}product/${doc.id}`;
			await rdfStoreService.deleteTriplesForSubject(productURI);
			logger.info(
				`[Product Model] RDF deleted for product ID: ${doc.id} after findOneAndDelete`,
			);
		} catch (error) {
			logger.error(
				`[Product Model] Error deleting product ID ${doc.id} from RDF store after findOneAndDelete:`,
				error,
			);
		}
	}
	next();
});

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} ProductModelType
 * @type {ProductModelType}
 */
const Product = mongoose.model("Product", productSchema);

export default Product;
