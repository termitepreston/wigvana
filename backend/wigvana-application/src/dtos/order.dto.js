import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     PlaceOrderInput:
 *       type: object
 *       required:
 *         - shippingAddressId
 *         - billingAddressId
 *         - paymentMethodId
 *       properties:
 *         cartId: # Optional: if not provided, uses the authenticated user's current cart.
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: "ID of the cart to checkout. If null, uses user's active cart."
 *         shippingAddressId:
 *           type: string
 *           format: uuid
 *         billingAddressId:
 *           type: string
 *           format: uuid
 *         paymentMethodId:
 *           type: string
 *           format: uuid
 *         shippingMethod: # Could be an ID or a string descriptor
 *           type: string
 *           example: "standard-shipping"
 *           description: "Selected shipping method identifier."
 *         notesByBuyer:
 *           type: string
 *           nullable: true
 *     OrderItemResponse: # For Order details
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         variantId:
 *           type: string
 *           format: uuid
 *         productNameSnapshot:
 *           type: string
 *         variantAttributesSnapshot:
 *           type: object
 *         quantity:
 *           type: integer
 *         unitPrice:
 *           type: number
 *           format: float
 *         totalPrice:
 *           type: number
 *           format: float
 *         itemStatus:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled, returned, refunded]
 *         # sellerId: # If needed
 *         #   type: string
 *         #   format: uuid
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         orderDate:
 *           type: string
 *           format: "date-time"
 *         status:
 *           type: string
 *           enum: [pending_payment, payment_failed, processing, shipped, out_for_delivery, delivered, cancelled_by_user, cancelled_by_seller, cancelled_by_admin, refund_pending, refunded, completed]
 *         shippingAddressSnapshot:
 *           type: object # Snapshot of the address used
 *         billingAddressSnapshot:
 *           type: object # Snapshot of the address used
 *         paymentMethodDetailsSnapshot:
 *           type: object # Snapshot of payment method used
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         subtotalAmount:
 *           type: number
 *         discountAmount:
 *           type: number
 *         shippingCost:
 *           type: number
 *         taxAmount:
 *           type: number
 *         totalAmount:
 *           type: number
 *         currency:
 *           type: string
 *         trackingNumber:
 *           type: string
 *           nullable: true
 *         carrier:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItemResponse'
 *         createdAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedOrders:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderResponse' # Could be a summarized OrderListItem
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     RequestReturnInput:
 *       type: object
 *       required:
 *         - orderItemId # Changed from itemId to be more specific to OrderItem
 *         - reason
 *         - quantity
 *       properties:
 *         orderItemId:
 *           type: string
 *           format: uuid
 *           description: "The ID of the specific OrderItem to return."
 *         reason:
 *           type: string
 *           description: "Reason for the return request."
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: "Quantity of the item to return."
 *     ReturnRequestResponse: # Placeholder for return request confirmation
 *       type: object
 *       properties:
 *         returnRequestId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           example: "pending_approval"
 *         message:
 *           type: string
 *           example: "Return request submitted successfully."
 *     UpdateOrderStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           # Define seller-updatable statuses based on your workflow
 *           enum: [processing, shipped, out_for_delivery, delivered, cancelled_by_seller]
 *           example: "shipped"
 *         trackingNumber:
 *           type: string
 *           nullable: true
 *           example: "1Z999AA10123456784"
 *         carrier:
 *           type: string
 *           nullable: true
 *           example: "UPS"
 *         notes: # Internal notes by seller for this status update
 *           type: string
 *           nullable: true
 *     # For Seller Returns Management
 *     SellerReturnListItem: # When seller lists return requests
 *       type: object
 *       properties:
 *         returnRequestId:
 *           type: string
 *           format: uuid
 *         orderId:
 *           type: string
 *           format: uuid
 *         orderItemId:
 *           type: string
 *           format: uuid
 *         productName:
 *           type: string
 *         quantity:
 *           type: integer
 *         reason:
 *           type: string
 *         buyerId:
 *           type: string
 *           format: uuid
 *         # buyerName:
 *         #   type: string
 *         status:
 *           type: string
 *           enum: [pending_approval, approved, rejected, processing_refund, refunded, item_received]
 *         requestedAt:
 *           type: string
 *           format: "date-time"
 *         updatedAt:
 *           type: string
 *           format: "date-time"
 *     PaginatedSellerReturns:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SellerReturnListItem'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         totalResults:
 *           type: integer
 *     UpdateReturnStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [approved, rejected, processing_refund, refunded, item_received]
 *           example: "approved"
 *         reason: # Required if rejecting, optional otherwise
 *           type: string
 *           nullable: true
 *           example: "Item not eligible for return as per policy."
 *         # internalNotes:
 *         #   type: string
 *         #   nullable: true
 */

export const placeOrderSchema = z.object({
  body: z.object({
    cartId: objectIdSchema.optional(), // If not provided, uses user's active cart
    shippingAddressId: objectIdSchema,
    billingAddressId: objectIdSchema,
    paymentMethodId: objectIdSchema,
    shippingMethod: z.string().trim().min(1, "Shipping method is required"),
    notesByBuyer: z.string().trim().nullable().optional(),
  }),
});

export const listOrdersQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      status: z
        .string()
        .optional()
        .describe("Filter orders by status (e.g., 'shipped', 'processing')"),
      // Add other filters like date range if needed
    })
    .strict(),
});

export const getOrderParamsSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const cancelOrderParamsSchema = z.object({
  // Same as getOrderParamsSchema
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const requestReturnSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
  body: z.object({
    orderItemId: objectIdSchema,
    reason: z.string().trim().min(1, "Reason for return is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  }),
});

// For Seller listing their orders
export const listSellerOrdersQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      status: z
        .string()
        .optional()
        .describe("Filter orders by status (e.g., 'processing', 'shipped')"),
      buyerId: objectIdSchema
        .optional()
        .describe("Filter orders by a specific buyer ID."),
      // Add other filters like date range, productId if needed
    })
    .strict(),
});

// getOrderParamsSchema is already defined in order.dto.js (reused)

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
  body: z
    .object({
      status: z.enum(
        [
          "processing",
          "shipped",
          "out_for_delivery",
          "delivered",
          "cancelled_by_seller",
          // Add more as per your workflow, e.g., 'awaiting_shipment'
        ],
        { required_error: "Status is required." },
      ),
      trackingNumber: z.string().trim().min(1).nullable().optional(),
      carrier: z.string().trim().min(1).nullable().optional(),
      notes: z.string().trim().min(1).nullable().optional(),
    })
    .refine(
      (data) => {
        // Tracking number required if status is 'shipped'
        if (data.status === "shipped" && !data.trackingNumber) return false;
        return true;
      },
      {
        message: "Tracking number is required when order status is 'shipped'.",
        path: ["trackingNumber"],
      },
    ),
});

// For Seller Return Management
export const listSellerReturnsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      status: z
        .enum([
          "pending_approval",
          "approved",
          "rejected",
          "processing_refund",
          "refunded",
          "item_received",
          "all",
        ])
        .default("all")
        .optional(),
      orderId: objectIdSchema.optional(),
      buyerId: objectIdSchema.optional(),
    })
    .strict(),
});

export const returnIdParamsSchema = z.object({
  params: z.object({
    returnId: objectIdSchema,
  }),
});

export const updateReturnStatusSchema = z.object({
  params: z.object({
    returnId: objectIdSchema,
  }),
  body: z
    .object({
      status: z.enum(
        [
          "approved",
          "rejected",
          "processing_refund",
          "refunded",
          "item_received",
        ],
        { required_error: "Return status is required." },
      ),
      reason: z.string().trim().min(1).nullable().optional(), // Required if rejecting
    })
    .refine(
      (data) => {
        if (
          data.status === "rejected" &&
          (!data.reason || data.reason.trim() === "")
        )
          return false;
        return true;
      },
      {
        message: "Reason is required when rejecting a return request.",
        path: ["reason"],
      },
    ),
});
