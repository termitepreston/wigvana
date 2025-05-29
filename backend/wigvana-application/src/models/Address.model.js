import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const addressSchema = new mongoose.Schema(
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
		addressLine1: {
			type: String,
			required: true,
			trim: true,
		},
		addressLine2: {
			type: String,
			trim: true,
		},
		city: {
			type: String,
			required: true,
			trim: true,
		},
		stateProvinceRegion: {
			type: String,
			required: true,
			trim: true,
		},
		postalCode: {
			type: String,
			required: true,
			trim: true,
		},
		country: {
			type: String, // e.g., ISO 3166-1 alpha-2 code like "US", "ET"
			required: true,
			trim: true,
		},
		addressType: {
			type: String,
			enum: ["shipping", "billing", "business"],
			required: true,
			index: true,
		},
		isDefaultShipping: {
			type: Boolean,
			default: false,
		},
		isDefaultBilling: {
			type: Boolean,
			default: false,
		},
		contactName: {
			type: String,
			trim: true,
		},
		contactPhone: {
			type: String,
			trim: true,
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
// addressSchema.post('save', async function(doc, next) {
//   try {
//     const triples = await RDFConverter.AddressToTriples(doc);
//     await rdfStoreService.insertTriples(triples);
//   } catch (error) {
//     logger.error('Error syncing Address to RDF store after save:', error);
//   }
//   next();
// });
// addressSchema.post('remove', async function(doc, next) { /* ... RDF delete logic ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} AddressModelType
 * @type {AddressModelType}
 */
const Address = mongoose.model("Address", addressSchema);

export default Address;
