import { ParsingClient, SparqlClient } from "sparql-http-client"; // Correct import
import config from "../config/index.js";
import logger from "../utils/logger.js";

let queryClient; // For SELECT, ASK, CONSTRUCT, DESCRIBE
let queryParsingClient;
let updateClient; // For INSERT, DELETE, UPDATE
let isGraphDbConfigured = false;

if (config.GRAPHDB_URL && config.GRAPHDB_REPOSITORY) {
	try {
		const endpointUrl = `${config.GRAPHDB_URL.replace(/\/$/, "")}/repositories/${config.GRAPHDB_REPOSITORY}`;
		const updateUrl = `${endpointUrl}/statements`; // GraphDB's update endpoint

		const authOptions = {
			user: "graphDBUser",
			password: "graphDBUser",
		};

		// Client for querying (SELECT, ASK, etc.)
		queryClient = new SparqlClient({
			endpointUrl,
			// Add authentication if needed:
			// ...authOptions,
		});

		logger.info("SPARQL reached here (2)");

		// Client specifically for updates (INSERT, DELETE)
		updateClient = new SparqlClient({
			endpointUrl: updateUrl, // Use the /statements endpoint for updates
			// Add authentication if needed (same as queryClient usually)
			// ...authOptions,
		});

		// You can also use ParsingClient for easier result handling
		queryParsingClient = new ParsingClient({ endpointUrl });

		isGraphDbConfigured = true;
		logger.info(
			`RDFStoreService configured for GraphDB SPARQL endpoint: ${endpointUrl}`,
		);

		// Optional: Test connection on startup by making a simple ASK query
		queryClient.query
			.ask("ASK { ?s ?p ?o }")
			.then((canConnect) => {
				if (canConnect)
					logger.info("Successfully connected to GraphDB SPARQL endpoint.");
				else
					logger.warn(
						"Could not confirm connection to GraphDB SPARQL endpoint (ASK query failed).",
					);
			})
			.catch((err) =>
				logger.error(
					"Error testing connection to GraphDB SPARQL endpoint:",
					err,
				),
			);
	} catch (error) {
		logger.error("Failed to initialize SparqlClient for GraphDB:", error);
		isGraphDbConfigured = false;
	}
} else {
	logger.warn(
		"GraphDB URL or Repository not configured. RDFStoreService will be non-functional.",
	);
}

/**
 * Inserts RDF triples (provided as an N-Triples string) into the RDF store.
 * @param {string} nTriplesString - The N-Triples data to insert.
 * @returns {Promise<void>}
 */
const insertTriples = async (nTriplesString) => {
	if (!isGraphDbConfigured || !updateClient) {
		logger.warn(
			"GraphDB not configured or update client not initialized; insert operation skipped.",
		);
		return;
	}
	if (!nTriplesString || nTriplesString.trim() === "") {
		logger.warn(
			"Empty N-Triples string provided for insertion; operation skipped.",
		);
		return;
	}

	try {
		// Option 1: Using SPARQL UPDATE query (generally more common and robust)
		const sparqlUpdate = `INSERT DATA { ${nTriplesString} }`;
		await updateClient.query.update(sparqlUpdate);
		logger.info(
			"Triples successfully inserted into RDF store via SPARQL UPDATE.",
		);

		// Option 2: Using StreamWriter for direct N-Triples upload (if supported well by endpoint)
		// This is often more efficient for large amounts of triples.
		// GraphDB's /statements endpoint usually expects SPARQL Update or direct RDF format upload.
		// If you were to upload a file directly (not via SPARQL update), it would be different.
		// For inserting N-Triples string programmatically, SPARQL UPDATE is standard.
		//
		// const nTriplesStream = Readable.from(nTriplesString);
		// const writer = new StreamWriter(updateClient); // updateClient's endpoint should be the /statements one
		// await writer.import(nTriplesStream, { contentType: 'application/n-triples'});
		// logger.info('Triples successfully imported into RDF store via StreamWriter.');
	} catch (error) {
		logger.error(
			"Error inserting triples into RDF store:",
			error.message,
			error.stack,
			error.response ? await error.response.text() : "",
		);
		// Handle specific errors, e.g., from `error.response.status`
		// throw error; // Re-throw to be handled by caller if necessary
	}
};

/**
 * Deletes all triples associated with a given subject URI from the RDF store.
 * @param {string} subjectURI - The URI of the resource whose direct triples should be deleted.
 * @returns {Promise<void>}
 */
const deleteTriplesForSubject = async (subjectURI) => {
	if (!isGraphDbConfigured || !updateClient) {
		logger.warn(
			"GraphDB not configured or update client not initialized; delete operation skipped.",
		);
		return;
	}
	if (!subjectURI) {
		logger.warn("Subject URI not provided for deletion; operation skipped.");
		return;
	}

	try {
		// This query deletes triples where the given URI is the subject.
		// It does NOT automatically delete triples where this URI might be an object,
		// nor does it cascade delete blank nodes that might become orphaned.
		// For more complex deletion logic, you'd need more sophisticated SPARQL.
		const sparqlUpdate = `DELETE WHERE { <${subjectURI}> ?p ?o . }`;
		await updateClient.query.update(sparqlUpdate);
		logger.info(`Triples for subject <${subjectURI}> deleted from RDF store.`);
	} catch (error) {
		logger.error(
			`Error deleting triples for subject <${subjectURI}>:`,
			error.message,
			error.stack,
			error.response ? await error.response.text() : "",
		);
		// throw error;
	}
};

/**
 * Executes a SPARQL SELECT query against the RDF store.
 * Uses ParsingClient for convenient result handling.
 * @param {string} sparqlQuery - The SPARQL SELECT query string.
 * @returns {Promise<Array<Record<string, import('@rdfjs/types').Term>>>} An array of binding objects.
 * Each binding object maps variable names to RDF/JS Term objects.
 * Returns an empty array on error or if not configured.
 */
const querySelect = async (sparqlQuery) => {
	if (!isGraphDbConfigured || !queryClient) {
		logger.warn(
			"GraphDB not configured or query client not initialized; SELECT query operation skipped.",
		);
		return []; // Return empty array, consistent with ParsingClient's select() on error.
	}
	try {
		// Using ParsingClient for automatic parsing of results to JavaScript objects
		const parsingQueryClient = new ParsingClient({
			endpointUrl: queryClient.store.endpoint.endpointUrl,
		});
		const bindings = await parsingQueryClient.query.select(sparqlQuery);
		// bindings is an array of objects, e.g., [{ s: namedNode('...'), p: namedNode('...'), o: literal('...') }, ...]
		return bindings;
	} catch (error) {
		logger.error(
			"Error executing SPARQL SELECT query:",
			error.message,
			error.stack,
			error.response ? await error.response.text() : "",
		);
		// throw error; // Re-throw to be handled by caller (e.g., the SPARQL endpoint controller)
		return []; // Or throw, depending on how the caller should handle errors
	}
};

/**
 * Executes a SPARQL ASK query.
 * @param {string} sparqlQuery - The SPARQL ASK query string.
 * @returns {Promise<boolean>} True if the pattern matches, false otherwise or on error.
 */
const queryAsk = async (sparqlQuery) => {
	if (!isGraphDbConfigured || !queryClient) {
		logger.warn(
			"GraphDB not configured or query client not initialized; ASK query operation skipped.",
		);
		return false;
	}
	try {
		return await queryClient.query.ask(sparqlQuery);
	} catch (error) {
		logger.error(
			"Error executing SPARQL ASK query:",
			error.message,
			error.stack,
			error.response ? await error.response.text() : "",
		);
		return false;
	}
};

/**
 * Executes a SPARQL CONSTRUCT query.
 * @param {string} sparqlQuery - The SPARQL CONSTRUCT query string.
 * @returns {Promise<import('@rdfjs/types').Quad[] | null>} An array of RDF/JS Quad objects, or null on error.
 */
const queryConstruct = async (sparqlQuery) => {
	if (!isGraphDbConfigured || !queryClient) {
		logger.warn(
			"GraphDB not configured or query client not initialized; CONSTRUCT query operation skipped.",
		);
		return null;
	}
	try {
		const quadStream = await queryClient.query.construct(sparqlQuery);
		// Convert stream to array of quads
		return new Promise((resolve, reject) => {
			const quads = [];
			quadStream.on("data", (quad) => quads.push(quad));
			quadStream.on("end", () => resolve(quads));
			quadStream.on("error", (err) => {
				logger.error("Error streaming CONSTRUCT query results:", err);
				reject(err);
			});
		});
	} catch (error) {
		logger.error(
			"Error executing SPARQL CONSTRUCT query:",
			error.message,
			error.stack,
			error.response ? await error.response.text() : "",
		);
		return null;
	}
};

export const rdfStoreService = {
	insertTriples,
	deleteTriplesForSubject,
	querySelect,
	queryAsk,
	queryConstruct,
	isConfigured: isGraphDbConfigured,
};
