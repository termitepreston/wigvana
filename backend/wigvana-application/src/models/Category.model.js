import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { RDFConverter } from "../utils/RDFConverter.js"; // Placeholder
import { rdfStoreService } from "../services/RDFStoreService.js"; // Placeholder
import logger from "../utils/logger.js";
import config from "../config/index.js"; // For DATA_BASE_URI

const DATA_BASE_URI = `${config.APP_BASE_URL}/data/`; // Consistent with RDFConverter

const categorySchema = new mongoose.Schema(
	{
		_id: {
			type: String,
			default: () => uuidv4(),
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			index: true,
		},
		description: {
			type: String,
			trim: true,
		},
		parentId: {
			type: String,
			ref: "Category",

			index: true,
		},
		imageUrl: {
			type: String,
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		displayOrder: {
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

// Pre-save hook to generate slug if not provided (example)
categorySchema.pre("save", function (next) {
	if (this.isModified("name") && !this.slug) {
		this.slug = this.name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "");
	}
	next();
});

// RDF Sync: Save/Update
categorySchema.post("save", async (doc, next) => {
	if (!rdfStoreService.isConfigured) {
		logger.debug(
			"[Category Model] RDF sync skipped: RDFStoreService not configured.",
		);
		return next();
	}
	try {
		// For updates, it's often easier to delete existing triples and re-insert.
		// More sophisticated updates would target specific triples.
		const categoryURI = `${DATA_BASE_URI}category/${doc.id}`;
		await rdfStoreService.deleteTriplesForSubject(categoryURI); // Delete old state

		const nTriplesString = await RDFConverter.CategoryToTriples(doc);
		if (nTriplesString) {
			await rdfStoreService.insertTriples(nTriplesString);
			logger.info(`[Category Model] RDF synced for category ID: ${doc.id}`);
		} else {
			logger.warn(
				`[Category Model] Failed to generate RDF for category ID: ${doc.id}. Sync skipped.`,
			);
		}
	} catch (error) {
		logger.error(
			`[Category Model] Error syncing category ID ${doc.id} to RDF store after save:`,
			error,
		);
		// Decide if this error should prevent the operation or just be logged.
		// For now, just logging.
	}
	next();
});

// RDF Sync: Delete
// Mongoose 'remove' hook is for doc.remove().
// For Model.deleteOne(), Model.findByIdAndDelete(), use 'deleteOne' or 'findOneAndDelete' hooks.
// This example uses 'remove' which might not be the primary way you delete.
categorySchema.post("remove", async (doc, next) => {
	// Or findOneAndDelete
	if (!rdfStoreService.isConfigured) {
		logger.debug(
			"[Category Model] RDF delete sync skipped: RDFStoreService not configured.",
		);
		return next();
	}
	try {
		const categoryURI = `${DATA_BASE_URI}category/${doc.id}`;
		await rdfStoreService.deleteTriplesForSubject(categoryURI);
		logger.info(`[Category Model] RDF deleted for category ID: ${doc.id}`);
	} catch (error) {
		logger.error(
			`[Category Model] Error deleting category ID ${doc.id} from RDF store:`,
			error,
		);
	}
	next();
});

// If you use Model.findByIdAndDelete() or Model.deleteOne(), the hook is different:
categorySchema.post("findOneAndDelete", async (doc, next) => {
	if (doc && rdfStoreService.isConfigured) {
		// doc is the deleted document
		try {
			const categoryURI = `${DATA_BASE_URI}category/${doc.id}`;
			await rdfStoreService.deleteTriplesForSubject(categoryURI);
			logger.info(
				`[Category Model] RDF deleted for category ID: ${doc.id} after findOneAndDelete`,
			);
		} catch (error) {
			logger.error(
				`[Category Model] Error deleting category ID ${doc.id} from RDF store after findOneAndDelete:`,
				error,
			);
		}
	}
	next();
});

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} CategoryModelType
 * @type {CategoryModelType}
 */
const Category = mongoose.model("Category", categorySchema);

export default Category;
