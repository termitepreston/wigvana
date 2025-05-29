import express from "express";
import { orderController } from "../controllers/order.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listSellerOrdersQuerySchema,
  getOrderParamsSchema, // Reused
  updateOrderStatusSchema,
  listSellerReturnsQuerySchema,
  updateReturnStatusSchema,
  returnIdParamsSchema,
} from "../dtos/order.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["seller"]));

/**
 * @openapi
 * tags:
 *   name: Seller Orders & Returns
 *   description: Management of orders and returns for authenticated sellers.
 */

// --- Seller Order Management ---

/**
 * @openapi
 * /me/store/orders:
 *   get:
 *     summary: List orders received by the seller
 *     tags: [Seller Orders & Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by order status.
 *       - in: query
 *         name: buyerId
 *         schema: { type: string, format: uuid }
 *         description: Filter by buyer ID.
 *     responses:
 *       200:
 *         description: A paginated list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedOrders'
 *       401: Unauthorized.
 *       403: Forbidden.
 */
router.get(
  "/orders",
  validate(listSellerOrdersQuerySchema),
  orderController.listMyStoreOrders,
);

/**
 * @openapi
 * /me/store/orders/{orderId}:
 *   get:
 *     summary: Get details of a specific order received by the seller
 *     tags: [Seller Orders & Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathOrderId'
 *     responses:
 *       200:
 *         description: Order details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Order not found or no items belong to seller.
 */
router.get(
  "/orders/:orderId",
  validate(getOrderParamsSchema),
  orderController.getMyStoreOrderDetails,
);

/**
 * @openapi
 * /me/store/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (e.g., "shipped", "processing")
 *     tags: [Seller Orders & Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathOrderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusInput'
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Order not found.
 */
router.patch(
  "/orders/:orderId/status",
  validate(updateOrderStatusSchema),
  orderController.updateMyStoreOrderStatus,
);

// --- Seller Return Management ---
/**
 * @openapi
 * /me/store/returns:
 *   get:
 *     summary: List return requests for the seller's items
 *     tags: [Seller Orders & Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending_approval, approved, rejected, processing_refund, refunded, item_received, all], default: all }
 *       - in: query
 *         name: orderId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: buyerId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: A paginated list of return requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSellerReturns'
 *       401: Unauthorized.
 *       403: Forbidden.
 */
router.get(
  "/returns",
  validate(listSellerReturnsQuerySchema),
  orderController.listMyStoreReturnRequests,
);

/**
 * @openapi
 * /me/store/returns/{returnId}/status:
 *   patch:
 *     summary: Update status of a return request
 *     tags: [Seller Orders & Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: returnId # Define pathReturnId in common.dto.js
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The ID of the return request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReturnStatusInput'
 *     responses:
 *       200:
 *         description: Return request status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerReturnListItem' # Or a more detailed ReturnRequestResponse
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Return request not found.
 */
router.patch(
  "/returns/:returnId/status",
  validate(updateReturnStatusSchema),
  orderController.updateMyStoreReturnStatus,
);

export default router;
