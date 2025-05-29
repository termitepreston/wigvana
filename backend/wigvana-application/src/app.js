import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { middleware as OpenApiValidatorMiddleware } from "express-openapi-validator";
import path from "node:path";
import { fileURLToPath } from "node:url";

import logger from "./utils/logger.js";
import config from "./config/index.js";
import mainRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import ApiError from "./errors/ApiError.js";
import httpStatusCodes from "http-status-codes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Setup pino-http logger
app.use(pinoHttp({ logger }));

// Enable CORS - configure origins as needed
app.use(
	cors({
		origin: "*", // Be more restrictive in production
		credentials: true,
	}),
);

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Parse cookies
app.use(cookieParser());

// --- OpenAPI Swagger Setup ---
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "E-commerce API",
			version: "1.0.0",
			description: "API documentation for the E-commerce platform",
		},
		servers: [
			{
				url: `http://localhost:${config.PORT}/api/v1`,
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			// Define common schemas for DTOs and responses here
			schemas: {
				ErrorResponse: {
					type: "object",
					properties: {
						code: { type: "integer", example: 400 },
						message: { type: "string", example: "Error message detail" },
						errors: {
							type: "array",
							items: {
								type: "object",
								properties: {
									path: { type: "string", example: "body.email" },
									message: { type: "string", example: "Invalid email format" },
								},
							},
							nullable: true,
						},
						stack: {
							type: "string",
							example: "Error stack trace (dev only)",
							nullable: true,
						},
					},
				},
				UserResponse: {
					// Example user response (excluding sensitive fields)
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						firstName: { type: "string" },
						lastName: { type: "string" },
						email: { type: "string", format: "email" },
						roles: {
							type: "array",
							items: { type: "string", enum: ["buyer", "seller", "admin"] },
						},
						emailVerified: { type: "boolean" },
						accountStatus: {
							type: "string",
							enum: [
								"active",
								"suspended",
								"pending_verification",
								"deactivated",
							],
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				AuthResponse: {
					type: "object",
					properties: {
						user: { $ref: "#/components/schemas/UserResponse" },
						accessToken: {
							type: "string",
							example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
						},
					},
				},
				RegisterUserDto: {
					type: "object",
					required: ["firstName", "lastName", "email", "password"],
					properties: {
						firstName: { type: "string", example: "John" },
						lastName: { type: "string", example: "Doe" },
						email: {
							type: "string",
							format: "email",
							example: "john.doe@example.com",
						},
						password: {
							type: "string",
							format: "password",
							example: "password123",
						},
					},
				},
				LoginUserDto: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: {
							type: "string",
							format: "email",
							example: "john.doe@example.com",
						},
						password: {
							type: "string",
							format: "password",
							example: "password123",
						},
					},
				},
				// ... add more DTOs and model schemas here
			},
		},
		security: [
			// Global security definition (can be overridden at operation level)
			{
				bearerAuth: [],
			},
		],
	},
	// Path to the API docs (JSDoc comments)
	apis: ["./src/routes/*.js", "./src/dtos/*.js"], // Adjust as needed
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, { explorer: true }),
);

// --- OpenAPI Validator Middleware ---
// Note: This should come AFTER Swagger UI and BEFORE your API routes if you want to validate against the spec
// Create a temporary openapi.yaml from swaggerSpec for the validator
// In a real app, you might generate this file as part of a build step
// or have a static openapi.yaml file that swagger-jsdoc also contributes to.
// For simplicity here, we'll use the dynamically generated spec.
app.use(
	OpenApiValidatorMiddleware({
		apiSpec: swaggerSpec, // Use the dynamically generated spec
		validateRequests: true, // Enable request validation
		validateResponses: {
			// Enable response validation (can be heavy for development)
			onError: (error, body, req) => {
				logger.error(
					"Response validation error:",
					error.message,
					"for",
					req.originalUrl,
				);
				logger.debug("Invalid Response Body:", body);
				// Don't throw, just log, as it's a server-side issue
			},
		},
		// Ajv options for validator
		// operationHandlers: path.join(__dirname, 'controllers'), // If you want to auto-wire controllers (advanced)
	}),
);

// API routes
app.use("/api/v1", mainRouter);

// Handle 404 Not Found for any other route
app.use((req, res, next) => {
	next(new ApiError(httpStatusCodes.NOT_FOUND, "Not Found"));
});

// Global error handler - must be the last middleware
app.use(errorHandler);

export default app;
