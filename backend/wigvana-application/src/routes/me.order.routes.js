import express from "express";
import { orderController } from "../controllers/order.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  placeOrderSchema,
  listOrdersQuerySchema,
  getOrderParamsSchema,
  cancelOrderParamsSchema,
  requestReturnSchema,
} from "../dtos/order.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["buyer"]));

/**
 * @openapi
 * tags:
 *   name: Buyer Orders
 *   description: Management of authenticated buyer's orders.
 */

/**
 * @openapi
 * /me/orders:
 *   post:
 *     summary: Place an order (checkout)
 *     tags: [Buyer Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaceOrderInput'
 *     responses:
 *       201:
 *         description: Order placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Bad request (e.g., empty cart, invalid IDs, payment failed).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart, address, or payment method not found.
 */
router.post("/", validate(placeOrderSchema), orderController.placeMyOrder);

/**
 * @openapi
 * /me/orders:
 *   get:
 *     summary: List buyer's order history
 *     tags: [Buyer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A paginated list of the buyer's orders.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedOrders'
 *       401:
 *         description: Unauthorized.
 */
router.get("/", validate(listOrdersQuerySchema), orderController.listMyOrders);

/**
 * @openapi
 * /me/orders/{orderId}:
 *   get:
 *     summary: Get details of a specific order
 *     tags: [Buyer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathOrderId' # Define in common.dto.js
 *     responses:
 *       200:
 *         description: Detailed information about the order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Order not found.
 */
router.get(
  "/:orderId",
  validate(getOrderParamsSchema),
  orderController.getMyOrderDetails,
);

/**
 * @openapi
 * /me/orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Buyer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathOrderId'
 *     responses:
 *       200:
 *         description: Order cancelled successfully. Returns updated order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Bad request (e.g., order cannot be cancelled).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Order not found.
 */
router.post(
  "/:orderId/cancel",
  validate(cancelOrderParamsSchema),
  orderController.cancelMyOrder,
);

/**
 * @openapi
 * /me/orders/{orderId}/returns:
 *   post:
 *     summary: Request a return for an order/item
 *     tags: [Buyer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathOrderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestReturnInput'
 *     responses:
 *       202: # Accepted for processing
 *         description: Return request submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReturnRequestResponse'
 *       400:
 *         description: Bad request (e.g., invalid item, quantity, or order status).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Order or item not found.
 */
router.post(
  "/:orderId/returns",
  validate(requestReturnSchema),
  orderController.requestMyReturn,
);

export default router;
