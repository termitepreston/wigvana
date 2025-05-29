import httpStatusCodes from "http-status-codes";
import { paymentService } from "../services/payment.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Controller to create a new payment method for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const createMyPaymentMethod = catchAsync(async (req, res) => {
  const paymentMethod = await paymentService.createPaymentMethod(
    req.user.id,
    req.body,
  );
  res.status(httpStatusCodes.CREATED).send(paymentMethod);
});

/**
 * Controller to list all payment methods for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const listMyPaymentMethods = catchAsync(async (req, res) => {
  const paymentMethods = await paymentService.listPaymentMethods(req.user.id);
  res.status(httpStatusCodes.OK).send(paymentMethods);
});

/**
 * Controller to get details of a specific payment method for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const getMyPaymentMethodDetails = catchAsync(async (req, res) => {
  const paymentMethod = await paymentService.getPaymentMethodById(
    req.user.id,
    req.params.paymentMethodId,
  );
  res.status(httpStatusCodes.OK).send(paymentMethod);
});

/**
 * Controller to update an existing payment method for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const updateMyPaymentMethod = catchAsync(async (req, res) => {
  const paymentMethod = await paymentService.updatePaymentMethod(
    req.user.id,
    req.params.paymentMethodId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(paymentMethod);
});

/**
 * Controller to delete a payment method for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const deleteMyPaymentMethod = catchAsync(async (req, res) => {
  await paymentService.deletePaymentMethod(
    req.user.id,
    req.params.paymentMethodId,
  );
  res.status(httpStatusCodes.NO_CONTENT).send();
});

export const paymentController = {
  createMyPaymentMethod,
  listMyPaymentMethods,
  getMyPaymentMethodDetails,
  updateMyPaymentMethod,
  deleteMyPaymentMethod,
};
