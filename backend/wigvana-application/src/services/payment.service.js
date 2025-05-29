import PaymentMethod from "../models/PaymentMethod.model.js";
import Address from "../models/Address.model.js"; // To validate billingAddressId
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";

const DEFAULT_PAYMENT_GATEWAY = "stripe";

/**
 * Handles setting a default payment method.
 * @param {string} userId - The user ID.
 * @param {InstanceType<typeof PaymentMethod>} currentPaymentMethod - The payment method being saved.
 */
const handleDefaultPaymentMethod = async (userId, currentPaymentMethod) => {
  if (currentPaymentMethod.isDefault) {
    await PaymentMethod.updateMany(
      { userId, _id: { $ne: currentPaymentMethod._id }, isDefault: true },
      { $set: { isDefault: false } },
    );
  }
};

/**
 * Creates a new payment method for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {typeof import('../dtos/payment.dto.js').createPaymentMethodSchema._input.body} paymentData - Payment method details.
 * @returns {Promise<InstanceType<typeof PaymentMethod>>} The created payment method document.
 */
const createPaymentMethod = async (userId, paymentData) => {
  // In a real scenario:
  // 1. Create/retrieve customer in payment gateway (e.g., Stripe customer).
  // 2. Attach payment method to customer using paymentData.paymentToken.
  // 3. The gateway returns details like cardBrand, lastFourDigits, expiry.
  // For this simulation, we assume these details might be passed or are part of the `paymentToken`'s representation.

  if (paymentData.billingAddressId) {
    const addressExists = await Address.findOne({
      _id: paymentData.billingAddressId,
      userId,
    });
    if (!addressExists) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Billing address not found.",
      );
    }
  }

  // Prevent duplicate paymentToken for the same user (idempotency for adding same card)
  const existingMethod = await PaymentMethod.findOne({
    userId,
    paymentGatewayToken: paymentData.paymentToken,
  });
  if (existingMethod) {
    logger.warn(
      `Payment method with token ${paymentData.paymentToken} already exists for user ${userId}. Returning existing.`,
    );
    // Optionally update its `isDefault` or `billingAddressId` if provided, then return.
    // For simplicity, just return the existing one or throw an error.
    // throw new ApiError(httpStatusCodes.CONFLICT, 'This payment method is already saved.');
    return existingMethod;
  }

  const paymentMethod = new PaymentMethod({
    ...paymentData,
    userId,
    paymentGateway: DEFAULT_PAYMENT_GATEWAY, // Or derive from token/service
    paymentGatewayToken: paymentData.paymentToken, // Store the actual token from provider
  });

  await handleDefaultPaymentMethod(userId, paymentMethod);
  await paymentMethod.save();
  return paymentMethod;
};

/**
 * Lists all payment methods for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @returns {Promise<Array<InstanceType<typeof PaymentMethod>>>} Array of payment method documents.
 */
const listPaymentMethods = async (userId) => {
  return PaymentMethod.find({ userId })
    .populate("billingAddressId") // Optionally populate billing address details
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Gets details of a specific payment method for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} paymentMethodId - The ID of the payment method.
 * @returns {Promise<InstanceType<typeof PaymentMethod>>} The payment method document.
 */
const getPaymentMethodById = async (userId, paymentMethodId) => {
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  }).populate("billingAddressId");
  if (!paymentMethod) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Payment method not found.");
  }
  return paymentMethod;
};

/**
 * Updates an existing payment method for a buyer (e.g., set as default, update billing address).
 * @param {string} userId - The ID of the buyer.
 * @param {string} paymentMethodId - The ID of the payment method to update.
 * @param {typeof import('../dtos/payment.dto.js').updatePaymentMethodSchema._input.body} updateData - Data to update.
 * @returns {Promise<InstanceType<typeof PaymentMethod>>} The updated payment method document.
 */
const updatePaymentMethod = async (userId, paymentMethodId, updateData) => {
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  });
  if (!paymentMethod) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Payment method not found.");
  }

  if (updateData.billingAddressId === null) {
    // Explicitly unsetting
    paymentMethod.billingAddressId = null;
  } else if (updateData.billingAddressId) {
    const addressExists = await Address.findOne({
      _id: updateData.billingAddressId,
      userId,
    });
    if (!addressExists) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Billing address not found.",
      );
    }
    paymentMethod.billingAddressId = updateData.billingAddressId;
  }

  if (typeof updateData.isDefault === "boolean") {
    paymentMethod.isDefault = updateData.isDefault;
  }

  await handleDefaultPaymentMethod(userId, paymentMethod);
  await paymentMethod.save();
  return paymentMethod.populate("billingAddressId");
};

/**
 * Deletes a payment method for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} paymentMethodId - The ID of the payment method to delete.
 * @returns {Promise<void>}
 */
const deletePaymentMethod = async (userId, paymentMethodId) => {
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  });
  if (!paymentMethod) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Payment method not found.");
  }

  // In a real scenario:
  // Detach payment method from customer in payment gateway (e.g., Stripe).
  // logger.info(`Simulating detachment of payment method ${paymentMethod.paymentGatewayToken} from gateway.`);

  await paymentMethod.deleteOne();
};

export const paymentService = {
  createPaymentMethod,
  listPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
};
