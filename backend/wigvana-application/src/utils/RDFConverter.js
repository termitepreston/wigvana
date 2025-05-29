import { DataFactory, Writer } from "n3";
import config from "../config/index.js"; // For base URI or other config
import logger from "./logger.js"; // For logging errors during conversion

const { namedNode, literal, quad } = DataFactory;

// Define your ontology base URIs - adjust these to your actual ontology
const SCHEMA_ORG = "http://schema.org/";
const YOUR_ONTOLOGY_PRODUCT = `${config.APP_BASE_URL}/ontology/product#`;
const YOUR_ONTOLOGY_CATEGORY = `${config.APP_BASE_URL}/ontology/category#`;
const DATA_BASE_URI = `${config.APP_BASE_URL}/data/`; // Base for your instance data

/**
 * @class RDFConverter
 * @description Utility class for converting Mongoose models to RDF triples.
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class RDFConverter {
	/**
	 * Converts a Category mongoose document to an N-Triples string.
	 * @param {import('../models/Category.model.js').default} categoryDoc - Mongoose category document.
	 * @returns {Promise<string|null>} N-Triples string or null if conversion fails.
	 */
	static async CategoryToTriples(categoryDoc) {
		if (!categoryDoc || !categoryDoc.id) {
			logger.error(
				"[RDFConverter] Category document or ID is missing for RDF conversion.",
			);
			return null;
		}

		const writer = new Writer({ format: "N-Triples" });
		const categoryURI = namedNode(`${DATA_BASE_URI}category/${categoryDoc.id}`);

		try {
			// Basic type
			writer.addQuad(
				categoryURI,
				namedNode(`${SCHEMA_ORG}Thing`), // Or a more specific type from your ontology
				namedNode(`${YOUR_ONTOLOGY_CATEGORY}Category`),
			);

			// Name
			if (categoryDoc.name) {
				writer.addQuad(
					categoryURI,
					namedNode(`${SCHEMA_ORG}name`),
					literal(categoryDoc.name),
				);
			}

			// Description
			if (categoryDoc.description) {
				writer.addQuad(
					categoryURI,
					namedNode(`${SCHEMA_ORG}description`),
					literal(categoryDoc.description),
				);
			}

			// Slug (custom property)
			if (categoryDoc.slug) {
				writer.addQuad(
					categoryURI,
					namedNode(`${YOUR_ONTOLOGY_CATEGORY}slug`),
					literal(categoryDoc.slug),
				);
			}

			// Image URL
			if (categoryDoc.imageUrl) {
				writer.addQuad(
					categoryURI,
					namedNode(`${SCHEMA_ORG}image`),
					namedNode(categoryDoc.imageUrl), // Assuming imageUrl is a valid URL
				);
			}

			// Parent Category (if exists)
			if (categoryDoc.parentId) {
				writer.addQuad(
					categoryURI,
					namedNode(`${SCHEMA_ORG}isPartOf`), // Or a custom property like yourOntology:hasParentCategory
					namedNode(`${DATA_BASE_URI}category/${categoryDoc.parentId}`),
				);
			}

			return new Promise((resolve, reject) => {
				writer.end((error, result) => {
					if (error) {
						logger.error(
							"[RDFConverter] Error serializing Category triples:",
							error,
						);
						reject(error);
					} else {
						resolve(result);
					}
				});
			});
		} catch (error) {
			logger.error(
				"[RDFConverter] Exception during Category triple generation:",
				error,
			);
			return null;
		}
	}

	/**
	 * Converts a Product mongoose document to an N-Triples string.
	 * @param {import('../models/Product.model.js').default} productDoc - Mongoose product document.
	 * @returns {Promise<string|null>} N-Triples string or null if conversion fails.
	 */
	static async ProductToTriples(productDoc) {
		if (!productDoc || !productDoc.id) {
			logger.error(
				"[RDFConverter] Product document or ID is missing for RDF conversion.",
			);
			return null;
		}

		const writer = new Writer({ format: "N-Triples" });
		const productURI = namedNode(`${DATA_BASE_URI}product/${productDoc.id}`);

		try {
			// Basic type (e.g., schema.org/Product)
			writer.addQuad(
				productURI,
				namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
				namedNode(`${SCHEMA_ORG}Product`),
			);

			// Name
			if (productDoc.name) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}name`),
					literal(productDoc.name),
				);
			}

			// Description
			if (productDoc.description) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}description`),
					literal(productDoc.description),
				);
			}

			// SKU (if you want to represent the base product's SKU, or variants separately)
			// For base product, maybe a generic identifier. Product variants would have schema:sku
			// writer.addQuad(productURI, namedNode(`${SCHEMA_ORG}identifier`), literal(`product-${productDoc.id}`));

			// Brand (can be Text or schema.org/Brand)
			if (productDoc.brand) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}brand`),
					literal(productDoc.brand), // Or create a Brand URI if you model brands separately
				);
			}

			// Category
			if (productDoc.categoryId) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}category`), // Or a more specific like yourOntology:hasCategory
					namedNode(`${DATA_BASE_URI}category/${productDoc.categoryId}`),
				);
			}

			// Price (using schema.org/Offer for pricing information)
			// This is a simplified representation. A full Offer might be a separate node.
			if (typeof productDoc.basePrice === "number" && productDoc.currency) {
				const offerURI = namedNode(`${productURI}/offer`); // Create a URI for the offer
				writer.addQuad(productURI, namedNode(`${SCHEMA_ORG}offers`), offerURI);
				writer.addQuad(
					offerURI,
					namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
					namedNode(`${SCHEMA_ORG}Offer`),
				);
				writer.addQuad(
					offerURI,
					namedNode(`${SCHEMA_ORG}price`),
					literal(
						productDoc.basePrice.toString(),
						namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
					),
				);
				writer.addQuad(
					offerURI,
					namedNode(`${SCHEMA_ORG}priceCurrency`),
					literal(productDoc.currency),
				);
			}

			// Seller (using schema.org/seller)
			if (productDoc.sellerId) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}seller`),
					namedNode(`${DATA_BASE_URI}user/${productDoc.sellerId}`), // Assuming sellerId is a User ID
				);
			}

			// Tags (using schema.org/keywords)
			if (productDoc.tags && productDoc.tags.length > 0) {
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}keywords`),
					literal(productDoc.tags.join(",")), // Comma-separated string is one way
				);
				// Alternatively, create individual triples for each tag if preferred
				// productDoc.tags.forEach(tag => {
				//   writer.addQuad(productURI, namedNode(`${SCHEMA_ORG}keywords`), literal(tag));
				// });
			}

			// isFeatured (custom property)
			writer.addQuad(
				productURI,
				namedNode(`${YOUR_ONTOLOGY_PRODUCT}isFeatured`),
				literal(
					productDoc.isFeatured.toString(),
					namedNode("http://www.w3.org/2001/XMLSchema#boolean"),
				),
			);

			// Average Rating and Review Count (using schema.org/AggregateRating)
			if (
				typeof productDoc.averageRating === "number" &&
				typeof productDoc.reviewCount === "number"
			) {
				const ratingURI = namedNode(`${productURI}/aggregaterating`);
				writer.addQuad(
					productURI,
					namedNode(`${SCHEMA_ORG}aggregateRating`),
					ratingURI,
				);
				writer.addQuad(
					ratingURI,
					namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
					namedNode(`${SCHEMA_ORG}AggregateRating`),
				);
				writer.addQuad(
					ratingURI,
					namedNode(`${SCHEMA_ORG}ratingValue`),
					literal(
						productDoc.averageRating.toString(),
						namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
					),
				);
				writer.addQuad(
					ratingURI,
					namedNode(`${SCHEMA_ORG}reviewCount`),
					literal(
						productDoc.reviewCount.toString(),
						namedNode("http://www.w3.org/2001/XMLSchema#integer"),
					),
				);
			}

			return new Promise((resolve, reject) => {
				writer.end((error, result) => {
					if (error) {
						logger.error(
							"[RDFConverter] Error serializing Product triples:",
							error,
						);
						reject(error);
					} else {
						resolve(result);
					}
				});
			});
		} catch (error) {
			logger.error(
				"[RDFConverter] Exception during Product triple generation:",
				error,
			);
			return null;
		}
	}
}
