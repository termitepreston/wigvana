import httpStatusCodes from "http-status-codes";
import { addressService } from "../services/address.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Controller to create a new address for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const createMyAddress = catchAsync(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  res.status(httpStatusCodes.CREATED).send(address);
});

/**
 * Controller to list all addresses for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const listMyAddresses = catchAsync(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.id);
  res.status(httpStatusCodes.OK).send(addresses);
});

/**
 * Controller to get details of a specific address for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const getMyAddressDetails = catchAsync(async (req, res) => {
  const address = await addressService.getAddressById(
    req.user.id,
    req.params.addressId,
  );
  res.status(httpStatusCodes.OK).send(address);
});

/**
 * Controller to update an existing address for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const updateMyAddress = catchAsync(async (req, res) => {
  const address = await addressService.updateAddress(
    req.user.id,
    req.params.addressId,
    req.body,
  );
  res.status(httpStatusCodes.OK).send(address);
});

/**
 * Controller to delete an address for the authenticated buyer.
 * @type {import('express').RequestHandler}
 */
const deleteMyAddress = catchAsync(async (req, res) => {
  await addressService.deleteAddress(req.user.id, req.params.addressId);
  res.status(httpStatusCodes.NO_CONTENT).send();
});

export const addressController = {
  createMyAddress,
  listMyAddresses,
  getMyAddressDetails,
  updateMyAddress,
  deleteMyAddress,
};
