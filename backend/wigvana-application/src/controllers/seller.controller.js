import httpStatusCodes from "http-status-codes";
import { sellerService } from "../services/seller.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Controller for a user to apply to become a seller.
 * @type {import('express').RequestHandler}
 */
const applyToBeSeller = catchAsync(async (req, res) => {
  const application = await sellerService.applyToBeSeller(
    req.user.id,
    req.body,
  );
  res.status(httpStatusCodes.CREATED).send(application);
});

/**
 * Controller to get the seller's store profile.
 * @type {import('express').RequestHandler}
 */
const getMyStoreProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.getOrCreateStoreProfile(req.user.id);
  res.status(httpStatusCodes.OK).send(profile);
});

/**
 * Controller to create or update the seller's store profile.
 * @type {import('express').RequestHandler}
 */
const upsertMyStoreProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.updateStoreProfile(req.user.id, req.body);
  // Check if it was created or updated by looking at timestamps or a flag from service
  const statusCode =
    profile.createdAt.getTime() === profile.updatedAt.getTime()
      ? httpStatusCodes.CREATED
      : httpStatusCodes.OK;
  res.status(statusCode).send(profile);
});

export const sellerController = {
  applyToBeSeller,
  getMyStoreProfile,
  upsertMyStoreProfile,
};
