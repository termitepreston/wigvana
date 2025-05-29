import express from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  getPaymentMethodParamsSchema,
} from "../dtos/payment.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["buyer"]));

/**
 * @openapi
 * tags:
 *   name: Buyer Payment Methods
 *   description: Management of authenticated buyer's saved payment methods.
 */

/**
 * @openapi
 * /me/payment-methods:
 *   post:
 *     summary: Add a new payment method
 *     tags: [Buyer Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethodInput'
 *     responses:
 *       201:
 *         description: Payment method added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 */
router.post(
  "/",
  validate(createPaymentMethodSchema),
  paymentController.createMyPaymentMethod,
);

/**
 * @openapi
 * /me/payment-methods:
 *   get:
 *     summary: List buyer's saved payment methods
 *     tags: [Buyer Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of payment methods.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethodResponse'
 *       401:
 *         description: Unauthorized.
 */
router.get("/", paymentController.listMyPaymentMethods);

/**
 * @openapi
 * /me/payment-methods/{paymentMethodId}:
 *   get:
 *     summary: Get details of a specific payment method
 *     tags: [Buyer Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathPaymentMethodId' # Define in common.dto.js
 *     responses:
 *       200:
 *         description: Detailed information about the payment method.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Payment method not found.
 */
router.get(
  "/:paymentMethodId",
  validate(getPaymentMethodParamsSchema),
  paymentController.getMyPaymentMethodDetails,
);

/**
 * @openapi
 * /me/payment-methods/{paymentMethodId}:
 *   patch:
 *     summary: Update a payment method (e.g., set as default)
 *     tags: [Buyer Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathPaymentMethodId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentMethodDto'
 *     responses:
 *       200:
 *         description: Payment method updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Payment method not found.
 */
router.patch(
  "/:paymentMethodId",
  validate(updatePaymentMethodSchema),
  paymentController.updateMyPaymentMethod,
);

/**
 * @openapi
 * /me/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Delete a payment method
 *     tags: [Buyer Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathPaymentMethodId'
 *     responses:
 *       204:
 *         description: Payment method deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Payment method not found.
 */
router.delete(
  "/:paymentMethodId",
  validate(getPaymentMethodParamsSchema),
  paymentController.deleteMyPaymentMethod,
);

export default router;
