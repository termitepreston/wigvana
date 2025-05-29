import express from "express";

// Import all route modules
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js"; // Public products & buyer review posting
import categoryRoutes from "./category.routes.js"; // Public categories
import anonymousCartRoutes from "./cart.routes.js"; // Anonymous cart operations
import sparqlRoutes from "./sparql.routes.js";

// Authenticated user's personal data and actions (/me/*)
import userRoutes from "./user.routes.js"; // /me profile, seller app, /me/conversations list
import meCartRoutes from "./me.cart.routes.js";
import meAddressRoutes from "./me.address.routes.js";
import mePaymentMethodRoutes from "./me.payment.method.routes.js";
import meOrderRoutes from "./me.order.routes.js";
import meReviewRoutes from "./me.review.routes.js"; // Buyer's own reviews & Seller's review responses

// Seller specific management of their store and products (prefixed with /me for ownership)
import meStoreRoutes from "./me.store.routes.js"; // Seller store profile
import meProductRoutes from "./me.product.routes.js"; // Seller's products (includes variant routes)
import meStoreOrderRoutes from "./me.store.order.routes.js"; // Seller managing their received orders & returns

// General authenticated access to resources (not necessarily prefixed with /me)
import conversationRoutes from "./conversation.routes.js"; // POST /conversations (buyer initiate), GET /conversations/:id, POST /conversations/:id/messages

// Admin routes
import adminRoutes from "./admin.routes.js";

const router = express.Router(); // This router will be mounted at /api/v1 in app.js

/**
 * @typedef {object} RouteConfig
 * @property {string} path - The base path for the routes from /api/v1.
 * @property {express.Router} route - The router instance.
 */

/**
 * Array of route configurations for the API.
 * Order can matter if paths are very generic, but with specific prefixes like /me, /admin, /products, it's usually fine.
 * @type {RouteConfig[]}
 */
const apiV1RouteConfig = [
	// Public / Unauthenticated first (or those with mixed auth like products)
	{ path: "/auth", route: authRoutes },
	{ path: "/products", route: productRoutes }, // Public product browsing AND buyer review submission
	{ path: "/categories", route: categoryRoutes },
	{ path: "/carts", route: anonymousCartRoutes }, // Anonymous carts
	{ path: "/sparql", route: sparqlRoutes },

	// Authenticated user general routes (profile, own conversations list)
	{ path: "/me", route: userRoutes }, // Handles: /me (profile), /me/password, /me/seller-application, /me/conversations

	// Buyer-specific authenticated routes (prefixed with /me)
	{ path: "/me/cart", route: meCartRoutes },
	{ path: "/me/addresses", route: meAddressRoutes },
	{ path: "/me/payment-methods", route: mePaymentMethodRoutes },
	{ path: "/me/orders", route: meOrderRoutes },
	{ path: "/me/reviews", route: meReviewRoutes }, // Buyer managing own reviews AND Seller responding

	// Seller-specific authenticated routes (prefixed with /me)
	{ path: "/me/store", route: meStoreRoutes }, // Seller store profile (GET, PUT on /me/store)
	// This also includes seller order management if meStoreOrderRoutes is mounted inside it
	// or if meStoreOrderRoutes defines paths relative to /me/store.
	// Based on me.store.order.routes.js, it expects to be mounted at /me/store
	// and its internal routes are /orders, /returns etc.
	{ path: "/me/store", route: meStoreOrderRoutes }, // Mounts /me/store/orders, /me/store/returns etc. *MERGES with above*
	{ path: "/me/products", route: meProductRoutes }, // Seller's products & variants

	// General authenticated routes (not necessarily /me)
	{ path: "/conversations", route: conversationRoutes }, // Initiate (buyer), Get Details, Send Message

	// Admin routes (highest privilege)
	{ path: "/admin", route: adminRoutes },
];

for (const routeConfig of apiV1RouteConfig) {
	router.use(routeConfig.path, routeConfig.route);
}

export default router;
