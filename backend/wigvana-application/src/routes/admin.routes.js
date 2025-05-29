import express from "express";
import { adminController } from "../controllers/admin.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
	// User Management DTOs
	listUsersQuerySchema,
	adminUpdateUserSchema,
	userIdParamsSchema, // Used for get, suspend, unsuspend
	// Seller Application DTOs
	listSellerApplicationsQuerySchema,
	sellerApplicationIdParamsSchema, // Used for approve
	rejectSellerApplicationSchema, // Used for reject
	// Product Management DTOs
	listAdminProductsQuerySchema,
	adminUpdateProductSchema,
	productIdParamsSchema, // Used for get, delete, feature, unfeature
	// Category Management DTOs
	adminCreateCategorySchema,
	adminUpdateCategorySchema,
	categoryIdParamsSchema, // Used for update, delete
	// Order Management DTOs
	listAdminOrdersQuerySchema,
	adminUpdateOrderStatusSchema,
	adminProcessRefundSchema,
	orderIdParamsSchema, // Used for get, status update, refund
	// Review Management DTOs
	listAdminReviewsQuerySchema,
	adminUpdateReviewStatusSchema,
	reviewIdParamsSchema, // Used for delete, status update
} from "../dtos/admin.dto.js"; // Assuming all admin DTOs are in admin.dto.js

const router = express.Router();

// Protect all admin routes and ensure user has 'admin' role
router.use(protect);
router.use(authorize(["admin"]));

/**
 * @openapi
 * tags:
 *   - name: Admin - User Management
 *     description: Platform user administration.
 *   - name: Admin - Seller Applications
 *     description: Management of seller applications.
 *   - name: Admin - Product Management
 *     description: Platform-wide product administration.
 *   - name: Admin - Category Management
 *     description: Global category administration.
 *   - name: Admin - Order Management
 *     description: Platform-wide order administration.
 *   - name: Admin - Review Management
 *     description: Platform-wide review moderation.
 */

// --- User Management ---
/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin - User Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pageParam'}
 *       - {$ref: '#/components/parameters/limitParam'}
 *       - name: role
 *         in: query
 *         schema: {type: string, enum: [buyer, seller, admin, all], default: all}
 *       - name: status
 *         in: query
 *         schema: {type: string, enum: [active, suspended, pending_verification, deactivated, all], default: all}
 *       - name: search
 *         in: query
 *         schema: {type: string}
 *         description: "Search by email, first name, or last name"
 *     responses:
 *       200:
 *         description: Paginated list of users.
 *         content: {application/json: {schema: {type: object, properties: {results: {type: array, items: {$ref: '#/components/schemas/UserResponse'}}, page: {type: integer}, limit: {type: integer}, totalPages: {type: integer}, totalResults: {type: integer}}}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 */
router.get("/users", validate(listUsersQuerySchema), adminController.listUsers);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     summary: Get details of a specific user
 *     tags: [Admin - User Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathUserId'}
 *     responses:
 *       200:
 *         description: User details.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/UserResponse'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.get(
	"/users/:userId",
	validate(userIdParamsSchema),
	adminController.getUserDetails,
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   patch:
 *     summary: Update a user's profile details or roles
 *     tags: [Admin - User Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathUserId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminUpdateUserInput'}}}
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/UserResponse'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.patch(
	"/users/:userId",
	validate(adminUpdateUserSchema),
	adminController.updateUser,
);

/**
 * @openapi
 * /admin/users/{userId}/suspend:
 *   post:
 *     summary: Suspend/Ban a user
 *     tags: [Admin - User Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathUserId'}
 *     responses:
 *       200:
 *         description: User suspended successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/UserResponse'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/users/:userId/suspend",
	validate(userIdParamsSchema),
	adminController.suspendUser,
);

/**
 * @openapi
 * /admin/users/{userId}/unsuspend:
 *   post:
 *     summary: Unsuspend a user
 *     tags: [Admin - User Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathUserId'}
 *     responses:
 *       200:
 *         description: User unsuspended successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/UserResponse'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/users/:userId/unsuspend",
	validate(userIdParamsSchema),
	adminController.unsuspendUser,
);

// --- Seller Application Management ---
/**
 * @openapi
 * /admin/seller-applications:
 *   get:
 *     summary: List seller applications
 *     tags: [Admin - Seller Applications]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pageParam'}
 *       - {$ref: '#/components/parameters/limitParam'}
 *       - name: status
 *         in: query
 *         schema: {type: string, enum: [pending_review, approved, rejected, requires_more_info, all], default: all}
 *       - name: userId
 *         in: query
 *         schema: {type: string, format: uuid}
 *         description: "Filter by applicant's user ID"
 *     responses:
 *       200:
 *         description: Paginated list of seller applications.
 *         content: {application/json: {schema: {type: object, properties: {results: {type: array, items: {$ref: '#/components/schemas/SellerApplicationResponse'}}, page: {type: integer}, limit: {type: integer}, totalPages: {type: integer}, totalResults: {type: integer}}}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 */
router.get(
	"/seller-applications",
	validate(listSellerApplicationsQuerySchema),
	adminController.listSellerApplications,
);

/**
 * @openapi
 * /admin/seller-applications/{applicationId}/approve:
 *   post:
 *     summary: Approve a seller application
 *     tags: [Admin - Seller Applications]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathApplicationId'}
 *     responses:
 *       200:
 *         description: Application approved successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/SellerApplicationResponse'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/seller-applications/:applicationId/approve",
	validate(sellerApplicationIdParamsSchema),
	adminController.approveSellerApplication,
);

/**
 * @openapi
 * /admin/seller-applications/{applicationId}/reject:
 *   post:
 *     summary: Reject a seller application
 *     tags: [Admin - Seller Applications]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathApplicationId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminSellerApplicationActionInput'}}}
 *     responses:
 *       200:
 *         description: Application rejected successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/SellerApplicationResponse'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/seller-applications/:applicationId/reject",
	validate(rejectSellerApplicationSchema),
	adminController.rejectSellerApplication,
);

// --- Product Management (Admin - Platform Wide) ---
/**
 * @openapi
 * /admin/products:
 *   get:
 *     summary: List all products from all sellers
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pageParam'}
 *       - {$ref: '#/components/parameters/limitParam'}
 *       - name: sellerId
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: categoryId
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: status # approvalStatus
 *         in: query
 *         schema: {type: string, enum: [pending, approved, rejected, all], default: all}
 *       - name: isPublished
 *         in: query
 *         schema: {type: string, enum: ["true", "false", "all"], default: all}
 *       - name: search
 *         in: query
 *         schema: {type: string}
 *       - name: sort_by
 *         in: query
 *         schema: {$ref: '#/components/schemas/ProductSortByEnum'}
 *       - name: order
 *         in: query
 *         schema: {type: string, enum: [asc, desc], default: desc}
 *     responses:
 *       200:
 *         description: Paginated list of products.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/PaginatedSellerProducts'}}} # Reuses seller product list format
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 */
router.get(
	"/products",
	validate(listAdminProductsQuerySchema),
	adminController.listAllProducts,
);

/**
 * @openapi
 * /admin/products/{productId}:
 *   get:
 *     summary: Get details of any product
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathProductId'}
 *     responses:
 *       200:
 *         description: Product details.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Product'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.get(
	"/products/:productId",
	validate(productIdParamsSchema),
	adminController.getAnyProductDetails,
);

/**
 * @openapi
 * /admin/products/{productId}:
 *   put: # Could be PATCH if only partial updates are typical for admin
 *     summary: Update any product (e.g., for policy violations)
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathProductId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminProductUpdateInput'}}}
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Product'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.put(
	"/products/:productId",
	validate(adminUpdateProductSchema),
	adminController.updateAnyProduct,
);

/**
 * @openapi
 * /admin/products/{productId}:
 *   delete:
 *     summary: Delete any product
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathProductId'}
 *     responses:
 *       204: {description: Product deleted successfully.}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.delete(
	"/products/:productId",
	validate(productIdParamsSchema),
	adminController.deleteAnyProduct,
);

/**
 * @openapi
 * /admin/products/{productId}/feature:
 *   post:
 *     summary: Mark a product as featured
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathProductId'}
 *     responses:
 *       200:
 *         description: Product marked as featured.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Product'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/products/:productId/feature",
	validate(productIdParamsSchema),
	adminController.featureProduct,
);

/**
 * @openapi
 * /admin/products/{productId}/feature:
 *   delete:
 *     summary: Remove a product from featured list
 *     tags: [Admin - Product Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathProductId'}
 *     responses:
 *       200:
 *         description: Product unfeatured.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Product'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.delete(
	"/products/:productId/feature",
	validate(productIdParamsSchema),
	adminController.unfeatureProduct,
);

// --- Category Management (Admin - Global Categories) ---
/**
 * @openapi
 * /admin/categories:
 *   post:
 *     summary: Create a new global category
 *     tags: [Admin - Category Management]
 *     security: [{"bearerAuth": []}]
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminCategoryInput'}}}
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Category'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       409: {$ref: '#/components/responses/ConflictError'} # e.g. slug exists
 */
router.post(
	"/categories",
	validate(adminCreateCategorySchema),
	adminController.createCategory,
);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   put:
 *     summary: Update a global category
 *     tags: [Admin - Category Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathCategoryId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminCategoryInput'}}} # Can reuse input or make a partial one
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/Category'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 *       409: {$ref: '#/components/responses/ConflictError'}
 */
router.put(
	"/categories/:categoryId",
	validate(adminUpdateCategorySchema),
	adminController.updateCategory,
);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   delete:
 *     summary: Delete a global category
 *     tags: [Admin - Category Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathCategoryId'}
 *     responses:
 *       204: {description: Category deleted successfully.}
 *       400: {$ref: '#/components/responses/BadRequestError'} # e.g. category in use
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.delete(
	"/categories/:categoryId",
	validate(categoryIdParamsSchema),
	adminController.deleteCategory,
);

// --- Order Management (Admin - Platform Wide) ---
/**
 * @openapi
 * /admin/orders:
 *   get:
 *     summary: List all orders on the platform
 *     tags: [Admin - Order Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pageParam'}
 *       - {$ref: '#/components/parameters/limitParam'}
 *       - name: userId # Buyer User ID
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: sellerId
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: status
 *         in: query
 *         schema: {type: string}
 *       - name: orderId
 *         in: query
 *         schema: {type: string, format: uuid}
 *         description: "Direct lookup for a specific order ID"
 *     responses:
 *       200:
 *         description: Paginated list of orders.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/PaginatedOrders'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 */
router.get(
	"/orders",
	validate(listAdminOrdersQuerySchema),
	adminController.listAllOrders,
);

/**
 * @openapi
 * /admin/orders/{orderId}:
 *   get:
 *     summary: Get details of any order
 *     tags: [Admin - Order Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathOrderId'}
 *     responses:
 *       200:
 *         description: Order details.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/OrderResponse'}}}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.get(
	"/orders/:orderId",
	validate(orderIdParamsSchema),
	adminController.getAnyOrderDetails,
);

/**
 * @openapi
 * /admin/orders/{orderId}/status:
 *   patch:
 *     summary: Update any order status (e.g., override, resolve disputes)
 *     tags: [Admin - Order Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathOrderId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminUpdateOrderInput'}}}
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/OrderResponse'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.patch(
	"/orders/:orderId/status",
	validate(adminUpdateOrderStatusSchema),
	adminController.updateAnyOrderStatus,
);

/**
 * @openapi
 * /admin/orders/{orderId}/refund:
 *   post:
 *     summary: Process refunds (if centralized)
 *     tags: [Admin - Order Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathOrderId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminProcessRefundInput'}}}
 *     responses:
 *       200:
 *         description: Refund processed successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/OrderResponse'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.post(
	"/orders/:orderId/refund",
	validate(adminProcessRefundSchema),
	adminController.processOrderRefund,
);

// --- Review Management (Admin) ---
/**
 * @openapi
 * /admin/reviews:
 *   get:
 *     summary: List all reviews
 *     tags: [Admin - Review Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pageParam'}
 *       - {$ref: '#/components/parameters/limitParam'}
 *       - name: userId
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: productId
 *         in: query
 *         schema: {type: string, format: uuid}
 *       - name: isApproved
 *         in: query
 *         schema: {type: string, enum: ["true", "false", "all"], default: all}
 *       - name: rating
 *         in: query
 *         schema: {type: integer, minimum: 1, maximum: 5}
 *     responses:
 *       200:
 *         description: Paginated list of reviews.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/PaginatedUserReviews'}}} # Reuses this schema
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 */
router.get(
	"/reviews",
	validate(listAdminReviewsQuerySchema),
	adminController.listAllReviews,
);

/**
 * @openapi
 * /admin/reviews/{reviewId}:
 *   delete:
 *     summary: Moderate/Delete a review (for policy violations)
 *     tags: [Admin - Review Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathReviewId'}
 *     responses:
 *       204: {description: Review deleted successfully.}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.delete(
	"/reviews/:reviewId",
	validate(reviewIdParamsSchema),
	adminController.deleteAnyReview,
);

/**
 * @openapi
 * /admin/reviews/{reviewId}/status:
 *   patch:
 *     summary: Update review status (e.g., approve, hide)
 *     tags: [Admin - Review Management]
 *     security: [{"bearerAuth": []}]
 *     parameters:
 *       - {$ref: '#/components/parameters/pathReviewId'}
 *     requestBody:
 *       required: true
 *       content: {application/json: {schema: {$ref: '#/components/schemas/AdminUpdateReviewStatusInput'}}}
 *     responses:
 *       200:
 *         description: Review status updated successfully.
 *         content: {application/json: {schema: {$ref: '#/components/schemas/ReviewResponse'}}}
 *       400: {$ref: '#/components/responses/BadRequestError'}
 *       401: {$ref: '#/components/responses/UnauthorizedError'}
 *       403: {$ref: '#/components/responses/ForbiddenError'}
 *       404: {$ref: '#/components/responses/NotFoundError'}
 */
router.patch(
	"/reviews/:reviewId/status",
	validate(adminUpdateReviewStatusSchema),
	adminController.updateReviewStatus,
);

export default router;
