import express from "express";
import httpStatusCodes from "http-status-codes";
import { rdfStoreService } from "../services/RDFStoreService.js"; // Ensure this is imported
import catchAsync from "../utils/catchAsync.js";
import { protect, authorize } from "../middlewares/auth.middleware.js"; // Optional: Secure if needed
import logger from "../utils/logger.js"; // For logging

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: SPARQL
 *   description: SPARQL query endpoint
 */

/**
 * @openapi
 * /sparql:
 *   post:
 *     summary: Execute a SPARQL SELECT query
 *     tags: [SPARQL]
 *     description: Accepts a SPARQL SELECT query in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/sparql-query:
 *           schema:
 *             type: string
 *             example: "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
 *         text/plain:
 *           schema:
 *             type: string
 *             example: "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
 *     responses:
 *       200:
 *         description: SPARQL query results.
 *         content:
 *           application/sparql-results+json:
 *             schema:
 *               type: object
 *               properties:
 *                 head:
 *                   type: object
 *                   properties:
 *                     vars:
 *                       type: array
 *                       items:
 *                         type: string
 *                 results:
 *                   type: object
 *                   properties:
 *                     bindings:
 *                       type: array
 *                       items:
 *                         type: object # Each object is a key-value pair of varName: { type, value }
 *       400:
 *         description: Invalid SPARQL query or RDF store not configured.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error executing query.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     # security:
 *     #  - bearerAuth: [] # If admin only
 */
router.post(
	"/",
	// protect, // Optional: protect this endpoint
	// authorize(['admin']), // Optional: only admins can query
	express.text({
		type: [
			"application/sparql-query",
			"text/plain",
			"application/x-www-form-urlencoded",
		],
	}), // Handle various content types for SPARQL
	catchAsync(async (req, res) => {
		if (!rdfStoreService.isConfigured) {
			logger.warn("SPARQL endpoint called but RDF store is not configured.");
			return res.status(httpStatusCodes.BAD_REQUEST).json({
				message: "RDF store (GraphDB) is not configured on the server.",
			});
		}

		let sparqlQuery = req.body;

		// GraphDB workbench often sends query in 'application/x-www-form-urlencoded' with a 'query' parameter
		if (
			req.is("application/x-www-form-urlencoded") &&
			req.body &&
			typeof req.body.query === "string"
		) {
			sparqlQuery = req.body.query;
		}

		if (typeof sparqlQuery !== "string" || sparqlQuery.trim() === "") {
			return res.status(httpStatusCodes.BAD_REQUEST).json({
				message:
					'SPARQL query is required in the body or as a "query" form parameter.',
			});
		}

		logger.debug(`Executing SPARQL query: ${sparqlQuery.substring(0, 200)}...`); // Log a snippet

		// Basic validation: only allow SELECT for now via this public endpoint for safety
		// More complex queries (UPDATE, INSERT, DELETE) should be handled by specific admin routes or internal service calls
		if (!sparqlQuery.trim().toLowerCase().startsWith("select")) {
			logger.warn(
				`Attempt to execute non-SELECT SPARQL query via public endpoint: ${sparqlQuery.substring(0, 50)}`,
			);
			return res.status(httpStatusCodes.BAD_REQUEST).json({
				message: "Only SELECT queries are allowed through this endpoint.",
			});
		}

		const results = await rdfStoreService.querySelect(sparqlQuery);
		res.set("Content-Type", "application/sparql-results+json"); // Standard content type for SPARQL JSON results
		res.status(httpStatusCodes.OK).json(results);
	}),
);

export default router;
