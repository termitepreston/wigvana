import httpStatusCodes from "http-status-codes";
import { orderService } from "../services/order.service.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";

/**
 * Controller to place an order.
 * @type {import('express').RequestHandler}
 */
const placeMyOrder = catchAsync(async (req, res) => {
  const order = await orderService.placeOrder(req.user.id, req.body);
  res.status(httpStatusCodes.CREATED).send(order);
});

/**
 * Controller to list buyer's order history.
 * @type {import('express').RequestHandler}
 */
const listMyOrders = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, ["page", "limit", "status"]);
  const result = await orderService.listBuyerOrders(req.user.id, queryOptions);
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller to get details of a specific order.
 * @type {import('express').RequestHandler}
 */
const getMyOrderDetails = catchAsync(async (req, res) => {
  const order = await orderService.getBuyerOrderById(
    req.user.id,
    req.params.orderId,
  );
  res.status(httpStatusCodes.OK).send(order);
});

/**
 * Controller to cancel an order.
 * @type {import('express').RequestHandler}
 */
const cancelMyOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelBuyerOrder(
    req.user.id,
    req.params.orderId,
  );
  res.status(httpStatusCodes.OK).send(order);
});

/**
 * Controller to request a return for an order/item.
 * @type {import('express').RequestHandler}
 */
const requestMyReturn = catchAsync(async (req, res) => {
  const returnConfirmation = await orderService.requestReturn(
    req.user.id,
    req.params.orderId,
    req.body,
  );
  res.status(httpStatusCodes.ACCEPTED).send(returnConfirmation); // 202 Accepted as it's a request
});

/**
 * Controller for a seller to list orders they received.
 * @type {import('express').RequestHandler}
 */
const listMyStoreOrders = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, ["page", "limit", "status", "buyerId"]);
  const result = await orderService.listSellerReceivedOrders(
    req.user.id,
    queryOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller for a seller to get details of a specific order they received.
 * @type {import('express').RequestHandler}
 */
const getMyStoreOrderDetails = catchAsync(async (req, res) => {
  const order = await orderService.getSellerReceivedOrderById(
    req.user.id,
    req.params.orderId,
  );
  res.status(httpStatusCodes.OK).send(order);
});

/**
 * Controller for a seller to update the status of an order.
 * @type {import('express').RequestHandler}
 */
const updateMyStoreOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateSellerOrderStatus(
    req.user.id,
    req.params.orderId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(order);
});

// --- Seller Return Management Controllers ---
/**
 * Controller for a seller to list return requests for their items.
 * @type {import('express').RequestHandler}
 */
const listMyStoreReturnRequests = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, [
    "page",
    "limit",
    "status",
    "orderId",
    "buyerId",
  ]);
  const result = await orderService.listSellerReturnRequests(
    req.user.id,
    queryOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller for a seller to update the status of a return request.
 * @type {import('express').RequestHandler}
 */
const updateMyStoreReturnStatus = catchAsync(async (req, res) => {
  const returnRequest = await orderService.updateSellerReturnRequestStatus(
    req.user.id,
    req.params.returnId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(returnRequest);
});

export const orderController = {
  placeMyOrder,
  listMyOrders,
  getMyOrderDetails,
  cancelMyOrder,
  requestMyReturn,
  listMyStoreOrders,
  getMyStoreOrderDetails,
  updateMyStoreOrderStatus,
  listMyStoreReturnRequests,
  updateMyStoreReturnStatus,
};
