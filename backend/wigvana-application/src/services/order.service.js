import Order from "../models/Order.model.js";
import OrderItem from "../models/OrderItem.model.js";
import Cart from "../models/Cart.model.js";
import CartItem from "../models/CartItem.model.js";
import Address from "../models/Address.model.js";
import PaymentMethod from "../models/PaymentMethod.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
// import { paymentGatewayService } from './paymentGateway.service.js'; // Hypothetical
// import { inventoryService } from './inventory.service.js'; // Hypothetical
// import { notificationService } from './notification.service.js'; // Hypothetical

/**
 * Places an order for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {typeof import('../dtos/order.dto.js').placeOrderSchema._input.body} orderData - Order placement data.
 * @returns {Promise<InstanceType<typeof Order>>} The created order document.
 */
const placeOrder = async (userId, orderData) => {
  const {
    cartId,
    shippingAddressId,
    billingAddressId,
    paymentMethodId,
    shippingMethod,
    notesByBuyer,
  } = orderData;

  // 1. Validate Cart
  let cartToCheckout;
  if (cartId) {
    cartToCheckout = await Cart.findOne({
      _id: cartId,
      userId,
      status: "active",
    });
    if (!cartToCheckout)
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "Specified cart not found or does not belong to user.",
      );
  } else {
    cartToCheckout = await Cart.findOne({ userId, status: "active" });
    if (!cartToCheckout)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "No active cart found for user.",
      );
  }

  const cartItems = await CartItem.find({ cartId: cartToCheckout._id })
    .populate("productId")
    .populate("variantId");

  if (cartItems.length === 0) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Cannot place an order with an empty cart.",
    );
  }

  // 2. Validate Addresses and Payment Method
  const shippingAddress = await Address.findOne({
    _id: shippingAddressId,
    userId,
  });
  if (!shippingAddress)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Shipping address not found.",
    );
  const billingAddress = await Address.findOne({
    _id: billingAddressId,
    userId,
  });
  if (!billingAddress)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Billing address not found.");
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  });
  if (!paymentMethod)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Payment method not found.");

  // 3. Calculate Totals (subtotal, shipping, tax, total) - Simplified
  let subtotalAmount = 0;

  for (const item of cartItems) {
    subtotalAmount += item.priceAtAddition * item.quantity;
  }
  const shippingCost = 5.0; // Placeholder
  const taxAmount = Number.parseFloat((subtotalAmount * 0.07).toFixed(2)); // Placeholder 7% tax
  const totalAmount = Number.parseFloat(
    (subtotalAmount + shippingCost + taxAmount).toFixed(2),
  );
  const currency = cartItems[0].currencyAtAddition; // Assume all items have same currency

  // 4. Process Payment (Simulated)
  // In real app: await paymentGatewayService.charge(paymentMethod.paymentGatewayToken, totalAmount, currency);
  // If payment fails, throw error. For now, assume success.
  const paymentGatewayTransactionId = `sim_txn_${uuidv4()}`;
  const paymentStatus = "paid";
  logger.info(
    `Simulated payment success for order. Txn ID: ${paymentGatewayTransactionId}`,
  );

  // 5. Create Order and OrderItems
  const order = new Order({
    userId,
    status: "processing", // Initial status after successful payment
    shippingAddressSnapshot: shippingAddress.toObject(), // Store a copy
    billingAddressSnapshot: billingAddress.toObject(),
    paymentMethodDetailsSnapshot: {
      // Store relevant, non-sensitive parts
      type: paymentMethod.type,
      cardBrand: paymentMethod.cardBrand,
      lastFourDigits: paymentMethod.lastFourDigits,
      paymentGateway: paymentMethod.paymentGateway,
    },
    paymentGatewayTransactionId,
    paymentStatus,
    subtotalAmount,
    shippingMethod,
    shippingCost,
    taxAmount,
    totalAmount,
    currency,
    notesByBuyer,
  });
  await order.save();

  for (const cartItem of cartItems) {
    await OrderItem.create({
      orderId: order._id,
      productId: cartItem.productId._id,
      variantId: cartItem.variantId._id,
      sellerId: cartItem.productId.sellerId, // Assuming productId is populated with sellerId
      productNameSnapshot: cartItem.productId.name,
      variantAttributesSnapshot: cartItem.variantId.attributes,
      quantity: cartItem.quantity,
      unitPrice: cartItem.priceAtAddition,
      totalPrice: cartItem.priceAtAddition * cartItem.quantity,
      itemStatus: "pending", // Initial status for each item
    });
    // 6. Deduct Inventory (Simulated)
    // await inventoryService.deductStock(cartItem.variantId._id, cartItem.quantity);
    await ProductVariant.findByIdAndUpdate(cartItem.variantId._id, {
      $inc: { stockQuantity: -cartItem.quantity },
    });
  }

  // 7. Clear Cart (or mark as completed)
  cartToCheckout.status = "completed";
  await cartToCheckout.save();
  // Optionally: await CartItem.deleteMany({ cartId: cartToCheckout._id });

  // 8. Send Notifications (Simulated)
  // await notificationService.sendOrderConfirmation(user.email, order);

  // Populate items for response
  const populatedOrder = await Order.findById(order._id)
    .populate({
      path: "items", // Virtual populate if you set it up, or query OrderItems
      model: OrderItem, // If not using virtual populate
    })
    .lean();

  // If you didn't use virtual populate, you'd fetch items separately:
  if (!populatedOrder.items) {
    populatedOrder.items = await OrderItem.find({ orderId: order._id }).lean();
  }

  return populatedOrder;
};

/**
 * Lists orders for a buyer with pagination and filtering.
 * @param {string} userId - The ID of the buyer.
 * @param {typeof import('../dtos/order.dto.js').listOrdersQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<{results: Array<InstanceType<typeof Order>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated orders.
 */
const listBuyerOrders = async (userId, queryOptions) => {
  const { page, limit, status } = queryOptions;
  const filter = { userId };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const orders = await Order.find(filter)
    .populate({ path: "items", model: OrderItem }) // Populate order items
    .sort({ orderDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: orders,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific order for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} orderId - The ID of the order.
 * @returns {Promise<InstanceType<typeof Order>>} The order document.
 */
const getBuyerOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId })
    .populate({
      path: "items",
      model: OrderItem,
      populate: [
        { path: "productId", select: "name slug" },
        { path: "variantId", select: "sku attributes" },
      ],
    })
    .lean();

  if (!order) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  }
  return order;
};

/**
 * Cancels an order if policy allows.
 * @param {string} userId - The ID of the buyer.
 * @param {string} orderId - The ID of the order to cancel.
 * @returns {Promise<InstanceType<typeof Order>>} The updated order document.
 */
const cancelBuyerOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  }

  // Policy: Allow cancellation only if status is 'processing' or 'pending_payment'
  if (!["processing", "pending_payment"].includes(order.status)) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Order cannot be cancelled in its current status: ${order.status}.`,
    );
  }

  order.status = "cancelled_by_user";
  // In a real app:
  // - Refund payment if already captured: await paymentGatewayService.refund(order.paymentGatewayTransactionId);
  // - Restore inventory: For each orderItem, await inventoryService.restoreStock(orderItem.variantId, orderItem.quantity);
  // - Notify seller/admin
  await order.save();
  logger.info(
    `Order ${orderId} cancelled by user ${userId}. Payment refund and inventory restoration would occur here.`,
  );
  return order.populate({ path: "items", model: OrderItem });
};

/**
 * Submits a return request for an item in an order.
 * @param {string} userId - The ID of the buyer.
 * @param {string} orderId - The ID of the order.
 * @param {typeof import('../dtos/order.dto.js').requestReturnSchema._input.body} returnData - Return request details.
 * @returns {Promise<Object>} Confirmation of return request.
 */
const requestReturn = async (userId, orderId, returnData) => {
  const { orderItemId, reason, quantity } = returnData;

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  }
  // Policy: Allow returns only if order is 'delivered' or 'completed' (within a certain timeframe)
  if (!["delivered", "completed"].includes(order.status)) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Items from this order cannot be returned in its current status: ${order.status}.`,
    );
  }

  const itemToReturn = await OrderItem.findOne({
    _id: orderItemId,
    orderId: order._id,
  });
  if (!itemToReturn) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Item not found in this order.",
    );
  }
  if (quantity > itemToReturn.quantity) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Return quantity cannot exceed ordered quantity.",
    );
  }
  if (
    itemToReturn.itemStatus === "returned" ||
    itemToReturn.itemStatus === "refunded"
  ) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "This item has already been processed for return/refund.",
    );
  }

  // Create a ReturnRequest record (needs a new Mongoose model: ReturnRequest)
  // For now, simulate by logging and updating item status (simplified)
  logger.info(
    `User ${userId} requested return for item ${orderItemId} (qty: ${quantity}) from order ${orderId}. Reason: ${reason}.`,
  );
  // In a real system:
  // const returnRequest = await ReturnRequest.create({ userId, orderId, orderItemId, quantity, reason, status: 'pending_approval' });
  // itemToReturn.itemStatus = 'return_pending'; // Or similar
  // await itemToReturn.save();
  // Notify seller

  return {
    returnRequestId: uuidv4(), // Simulated ID
    orderId,
    orderItemId,
    status: "pending_approval", // Simulated status
    message: "Return request submitted. Awaiting seller approval.",
  };
};

/**
 * Lists orders containing items sold by a specific seller.
 * This is more complex as an order can have items from multiple sellers.
 * We'll query OrderItems for the seller, then group by Order, or fetch those Orders.
 * @param {string} sellerId - The ID of the seller.
 * @param {typeof import('../dtos/order.dto.js').listSellerOrdersQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<{results: Array<InstanceType<typeof Order>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated orders.
 */
const listSellerReceivedOrders = async (sellerId, queryOptions) => {
  const { page, limit, status: orderStatusFilter, buyerId } = queryOptions;

  // Find OrderItem IDs relevant to this seller
  const orderItemFilter = { sellerId };
  // If filtering by buyer, it can be applied at the Order level later
  // If filtering by order status, it's also applied at the Order level.

  // Get distinct order IDs that contain items from this seller
  const distinctOrderIdsQuery = OrderItem.distinct("orderId", orderItemFilter);
  const distinctOrderIds = await distinctOrderIdsQuery;

  if (distinctOrderIds.length === 0) {
    return { results: [], page, limit, totalPages: 0, totalResults: 0 };
  }

  const orderFilter = { _id: { $in: distinctOrderIds } };
  if (orderStatusFilter) {
    orderFilter.status = orderStatusFilter;
  }
  if (buyerId) {
    orderFilter.userId = buyerId; // userId on Order is the buyerId
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(orderFilter)
    .populate({
      path: "items", // Populate all items for the order
      model: OrderItem,
      populate: [
        // Further populate product/variant for each item
        { path: "productId", select: "name slug imageUrl" },
        { path: "variantId", select: "sku attributes" },
      ],
    })
    .populate("userId", "firstName lastName email") // Populate buyer details
    .sort({ orderDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Filter items within each order to show only those belonging to the seller for this view,
  // or decide if the seller sees the whole order but can only act on their items.
  // For now, we return the full order, and the seller acts on their items or overall order status.
  // If you want to show *only* seller's items in the response:
  // orders.forEach(order => {
  //   order.items = order.items.filter(item => item.sellerId.toString() === sellerId);
  // });

  const totalResults = await Order.countDocuments(orderFilter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: orders,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific order if it contains items sold by the seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} orderId - The ID of the order.
 * @returns {Promise<InstanceType<typeof Order>>} The order document.
 */
const getSellerReceivedOrderById = async (sellerId, orderId) => {
  // Check if any item in this order belongs to the seller
  const sellerOrderItemExists = await OrderItem.exists({ orderId, sellerId });
  if (!sellerOrderItemExists) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Order not found or no items in this order belong to you.",
    );
  }

  const order = await Order.findById(orderId)
    .populate({
      path: "items",
      model: OrderItem,
      populate: [
        { path: "productId", select: "name slug imageUrl" },
        { path: "variantId", select: "sku attributes" },
      ],
    })
    .populate("userId", "firstName lastName email profilePictureUrl") // Buyer info
    .lean();

  if (!order) {
    // Should be caught by exists check, but as a safeguard
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  }
  // Optionally filter order.items to only those of the seller if needed for this specific view
  // order.items = order.items.filter(item => item.sellerId.toString() === sellerId);
  return order;
};

/**
 * Updates the status of an order (or specific items if multi-seller per order).
 * For simplicity, this updates the overall order status.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} orderId - The ID of the order.
 * @param {typeof import('../dtos/order.dto.js').updateOrderStatusSchema._input.body} statusData - New status and related info.
 * @returns {Promise<InstanceType<typeof Order>>} The updated order document.
 */
const updateSellerOrderStatus = async (sellerId, orderId, statusData) => {
  // Ensure seller has items in this order
  const sellerOrderItemExists = await OrderItem.exists({ orderId, sellerId });
  if (!sellerOrderItemExists) {
    throw new ApiError(
      httpStatusCodes.FORBIDDEN,
      "You do not have items in this order to update its status.",
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  }

  // Seller can only transition to certain statuses
  const allowedSellerStatuses = [
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled_by_seller",
  ];
  if (!allowedSellerStatuses.includes(statusData.status)) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Invalid status update: ${statusData.status}.`,
    );
  }

  // Policy checks (e.g., cannot set to 'delivered' if not 'shipped' or 'out_for_delivery')
  // if (statusData.status === 'shipped' && order.status !== 'processing') { ... }

  order.status = statusData.status;
  if (statusData.status === "shipped") {
    if (!statusData.trackingNumber)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Tracking number required for shipped status.",
      );
    order.trackingNumber = statusData.trackingNumber;
    order.carrier = statusData.carrier || order.carrier; // Keep old carrier if new one not provided
    // TODO: Update item statuses to 'shipped' for items belonging to this seller in this order
    await OrderItem.updateMany(
      { orderId, sellerId },
      { $set: { itemStatus: "shipped" } },
    );
  }
  if (statusData.status === "delivered") {
    await OrderItem.updateMany(
      { orderId, sellerId },
      { $set: { itemStatus: "delivered" } },
    );
  }
  if (statusData.notes) {
    order.internalNotes = `${order.internalNotes ? `${order.internalNotes}\n` : ""}Seller Note: ${statusData.notes}`;
  }

  await order.save();
  // TODO: Notify buyer of status change.
  // await notificationService.sendOrderStatusUpdate(order.userId.email, order, statusData.status);
  logger.info(
    `Order ${orderId} status updated to ${statusData.status} by seller ${sellerId}.`,
  );
  return order.populate({ path: "items", model: OrderItem });
};

// --- Seller Return Management (Simplified - assumes a ReturnRequest model) ---
// You would need to create a 'ReturnRequest' Mongoose model similar to other entities.
// It would link to Order, OrderItem, User (buyer), User (seller processing), and have fields like
// quantity, reason, status (pending_approval, approved, rejected, item_received, refund_processing, refunded), sellerNotes.

/**
 * Lists return requests associated with items sold by the seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {typeof import('../dtos/order.dto.js').listSellerReturnsQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<Object>} Paginated return requests.
 */
const listSellerReturnRequests = async (sellerId, queryOptions) => {
  // const { page, limit, status, orderId, buyerId } = queryOptions;
  // const filter = { sellerId }; // Assuming ReturnRequest has a sellerId field
  // if (status && status !== 'all') filter.status = status;
  // if (orderId) filter.orderId = orderId;
  // if (buyerId) filter.buyerId = buyerId; // Assuming ReturnRequest has buyerId

  // const skip = (page - 1) * limit;
  // const returns = await ReturnRequest.find(filter)
  //   .populate('orderId', '...')
  //   .populate('orderItemId', '...')
  //   .populate('buyerId', 'firstName lastName email')
  //   .sort({ createdAt: -1 })
  //   .skip(skip)
  //   .limit(limit)
  //   .lean();
  // const totalResults = await ReturnRequest.countDocuments(filter);
  // const totalPages = Math.ceil(totalResults / limit);
  // return { results: returns, page, limit, totalPages, totalResults };
  logger.warn(
    "ReturnRequest model and full service logic not yet implemented.",
  );
  return { results: [], page: 1, limit: 10, totalPages: 0, totalResults: 0 };
};

/**
 * Updates the status of a return request by the seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} returnId - The ID of the return request.
 * @param {typeof import('../dtos/order.dto.js').updateReturnStatusSchema._input.body} statusData - New status and reason.
 * @returns {Promise<any>} The updated return request.
 */
const updateSellerReturnRequestStatus = async (
  sellerId,
  returnId,
  statusData,
) => {
  // const returnRequest = await ReturnRequest.findOne({ _id: returnId, sellerId });
  // if (!returnRequest) {
  //   throw new ApiError(httpStatusCodes.NOT_FOUND, 'Return request not found or does not belong to you.');
  // }
  // if (statusData.status === 'rejected' && !statusData.reason) {
  //   throw new ApiError(httpStatusCodes.BAD_REQUEST, 'Reason is required when rejecting a return.');
  // }
  // returnRequest.status = statusData.status;
  // if (statusData.reason) returnRequest.sellerNotes = statusData.reason;
  // await returnRequest.save();
  // // If approved, trigger refund process or instruct buyer on return shipping.
  // // If item_received, inspect item, then trigger refund.
  // // If refunded, update OrderItem status.
  // // Notify buyer.
  // return returnRequest;
  logger.warn(
    "ReturnRequest model and full service logic not yet implemented.",
  );
  return {
    returnRequestId: returnId,
    status: statusData.status,
    message: "Status update simulated.",
  };
};

/**
 * (Admin) Lists all orders on the platform.
 * @param {typeof import('../dtos/admin.dto.js').listAdminOrdersQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<Object>} Paginated orders.
 */
const listAllPlatformOrders = async (queryOptions) => {
  const { page, limit, userId, sellerId, status, orderId } = queryOptions;
  const filter = {};

  if (orderId) {
    // Direct lookup by orderId takes precedence
    filter._id = orderId;
  } else {
    if (userId) filter.userId = userId; // Buyer's ID
    if (status) filter.status = status;

    if (sellerId) {
      // If filtering by seller, find orders containing their items
      const sellerOrderIds = await OrderItem.distinct("orderId", { sellerId });
      if (sellerOrderIds.length === 0 && !filter._id)
        return { results: [], page, limit, totalPages: 0, totalResults: 0 };
      filter._id = filter._id
        ? { $in: [filter._id, ...sellerOrderIds] }
        : { $in: sellerOrderIds };
    }
  }

  const skip = (page - 1) * limit;
  const orders = await Order.find(filter)
    .populate("userId", "firstName lastName email") // Buyer
    .populate({
      path: "items",
      model: OrderItem,
      populate: { path: "sellerId", select: "firstName lastName email" },
    }) // Populate items and their sellers
    .sort({ orderDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  return { results: orders, page, limit, totalPages, totalResults };
};

/**
 * (Admin) Gets details of any order on the platform.
 * @param {string} orderId - ID of the order.
 * @returns {Promise<InstanceType<typeof Order>>} Order document.
 */
const adminGetOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("userId", "firstName lastName email")
    .populate({
      path: "items",
      model: OrderItem,
      populate: [
        { path: "productId", select: "name slug" },
        { path: "variantId", select: "sku attributes" },
        { path: "sellerId", select: "firstName lastName email" },
      ],
    });
  if (!order) throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  return order;
};

/**
 * (Admin) Updates any order status (e.g., override, resolve disputes).
 * @param {string} orderId - ID of the order.
 * @param {typeof import('../dtos/admin.dto.js').adminUpdateOrderStatusSchema._input.body} statusData - Data.
 * @returns {Promise<InstanceType<typeof Order>>} Updated order.
 */
const adminUpdateOrderStatus = async (orderId, statusData) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");

  order.status = statusData.status;
  if (statusData.notes) {
    order.internalNotes = `${order.internalNotes ? `${order.internalNotes}\n` : ""}Admin Note: ${statusData.notes}`;
  }
  await order.save();
  // TODO: Notify relevant parties (buyer, seller(s))
  logger.info(`Admin updated order ${orderId} status to ${statusData.status}.`);
  return adminGetOrderById(orderId); // Fetch with population
};

/**
 * (Admin) Processes a refund for an order (if centralized).
 * @param {string} orderId - ID of the order.
 * @param {typeof import('../dtos/admin.dto.js').adminProcessRefundSchema._input.body} refundData - Data.
 * @returns {Promise<InstanceType<typeof Order>>} Updated order.
 */
const adminProcessRefund = async (orderId, refundData) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(httpStatusCodes.NOT_FOUND, "Order not found.");
  if (order.paymentStatus === "refunded" && order.totalAmount === 0) {
    // Simplified full refund check
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Order already fully refunded.",
    );
  }
  if (refundData.amount > order.totalAmount - (order.refundedAmount || 0)) {
    // Assuming `refundedAmount` field on Order
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Refund amount ${refundData.amount} exceeds refundable amount.`,
    );
  }

  // Simulate refund processing with a payment gateway
  logger.info(
    `Admin processing refund of ${refundData.amount} for order ${orderId}. Reason: ${refundData.reason}. Gateway Txn: ${order.paymentGatewayTransactionId}`,
  );
  // paymentGatewayService.processRefund(order.paymentGatewayTransactionId, refundData.amount);

  order.paymentStatus = "refunded"; // Or 'partially_refunded'
  order.status = "refunded"; // Or a more specific status
  // order.refundedAmount = (order.refundedAmount || 0) + refundData.amount;
  order.internalNotes = `${order.internalNotes ? `${order.internalNotes}\n` : ""}Admin Refund: ${refundData.amount} (${refundData.reason}).`;

  await order.save();
  // TODO: Update OrderItem statuses if item-specific refund
  // TODO: Notify buyer
  return adminGetOrderById(orderId);
};

export const orderService = {
  placeOrder,
  listBuyerOrders,
  getBuyerOrderById,
  cancelBuyerOrder,
  requestReturn,
  listSellerReceivedOrders,
  getSellerReceivedOrderById,
  updateSellerOrderStatus,
  listSellerReturnRequests,
  updateSellerReturnRequestStatus,
  listAllPlatformOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminProcessRefund,
};
