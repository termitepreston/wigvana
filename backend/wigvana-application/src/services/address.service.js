import Address from "../models/Address.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * Handles setting default addresses. If a new address is set as default,
 * any other address of the same type for that user will be unset as default.
 * @param {string} userId - The user ID.
 * @param {InstanceType<typeof Address>} currentAddress - The address being saved.
 */
const handleDefaultAddress = async (userId, currentAddress) => {
  if (currentAddress.isDefaultShipping) {
    await Address.updateMany(
      {
        userId,
        _id: { $ne: currentAddress._id },
        addressType: "shipping",
        isDefaultShipping: true,
      },
      { $set: { isDefaultShipping: false } },
    );
  }
  if (currentAddress.isDefaultBilling) {
    await Address.updateMany(
      {
        userId,
        _id: { $ne: currentAddress._id },
        addressType: "billing",
        isDefaultBilling: true,
      },
      { $set: { isDefaultBilling: false } },
    );
  }
};

/**
 * Creates a new address for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {typeof import('../dtos/address.dto.js').createAddressSchema._input.body} addressData - Address details.
 * @returns {Promise<InstanceType<typeof Address>>} The created address document.
 */
const createAddress = async (userId, addressData) => {
  const address = new Address({ ...addressData, userId });
  await handleDefaultAddress(userId, address); // Handle default flags before saving new one
  await address.save();
  return address;
};

/**
 * Lists all addresses for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @returns {Promise<Array<InstanceType<typeof Address>>>} Array of address documents.
 */
const listAddresses = async (userId) => {
  return Address.find({ userId }).sort({ createdAt: -1 }).lean();
};

/**
 * Gets details of a specific address for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} addressId - The ID of the address.
 * @returns {Promise<InstanceType<typeof Address>>} The address document.
 */
const getAddressById = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Address not found.");
  }
  return address;
};

/**
 * Updates an existing address for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} addressId - The ID of the address to update.
 * @param {typeof import('../dtos/address.dto.js').updateAddressSchema._input.body} updateData - Data to update.
 * @returns {Promise<InstanceType<typeof Address>>} The updated address document.
 */
const updateAddress = async (userId, addressId, updateData) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Address not found.");
  }

  Object.assign(address, updateData);
  await handleDefaultAddress(userId, address); // Handle default flags before saving update
  await address.save();
  return address;
};

/**
 * Deletes an address for a buyer.
 * @param {string} userId - The ID of the buyer.
 * @param {string} addressId - The ID of the address to delete.
 * @returns {Promise<void>}
 */
const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Address not found.");
  }
  // TODO: Check if address is used in any pending orders before deletion, or handle that relation.
  await address.deleteOne();
};

export const addressService = {
  createAddress,
  listAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
};
