import SellerApplication from "../models/SellerApplication.model.js";
import SellerProfile from "../models/SellerProfile.model.js";
import User from "../models/User.model.js";
import Address from "../models/Address.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";

/**
 * Creates a seller application.
 * @param {string} userId - The ID of the user applying.
 * @param {typeof import('../dtos/seller.dto.js').sellerApplicationSchema._input.body} applicationData - Application details.
 * @returns {Promise<InstanceType<typeof SellerApplication>>} The created seller application.
 */
const applyToBeSeller = async (userId, applicationData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  if (user.roles.includes("seller")) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "User is already a seller.",
    );
  }

  const existingApplication = await SellerApplication.findOne({
    userId,
    status: { $in: ["pending_review", "requires_more_info"] },
  });
  if (existingApplication) {
    throw new ApiError(
      httpStatusCodes.CONFLICT,
      "You already have a pending or active seller application.",
    );
  }

  const application = await SellerApplication.create({
    ...applicationData,
    userId,
    status: "pending_review",
  });
  return application;
};

/**
 * Gets or creates the seller's store profile.
 * If profile exists, it's returned. If not, a basic one is created.
 * @param {string} userId - The ID of the seller.
 * @returns {Promise<InstanceType<typeof SellerProfile>>} The seller's store profile.
 */
const getOrCreateStoreProfile = async (userId) => {
  let profile = await SellerProfile.findOne({ userId }).populate(
    "businessAddressId",
  );
  if (!profile) {
    const user = await User.findById(userId).select("email firstName lastName");
    if (!user)
      throw new ApiError(
        httpStatusCodes.INTERNAL_SERVER_ERROR,
        "Associated user not found for seller profile.",
      );

    // Create a basic profile if one doesn't exist
    // This might happen if a user becomes a seller via admin action without an application.
    profile = await SellerProfile.create({
      userId,
      storeName: `${user.firstName}'s Store`, // Default store name
      verificationStatus: "not_applied", // Or 'approved' if they are already a seller role
    });
    logger.info(`Created initial store profile for user ${userId}.`);
  }
  return profile;
};

/**
 * Updates the seller's store profile.
 * @param {string} userId - The ID of the seller.
 * @param {typeof import('../dtos/seller.dto.js').storeProfileInputSchema._input.body} updateData - Data to update.
 * @returns {Promise<InstanceType<typeof SellerProfile>>} The updated store profile.
 */
const updateStoreProfile = async (userId, updateData) => {
  const profile = await SellerProfile.findOne({ userId });
  if (!profile) {
    // Optionally, create one if it doesn't exist, or throw error
    // For PUT, it's common to create if not exists, or update if exists.
    // Let's assume `getOrCreateStoreProfile` is called before this or by controller.
    // So, if it's still not found, it's an issue.
    // However, PUT /me/store is defined as "Create or update", so we create.
    logger.info(`No existing store profile for user ${userId}. Creating one.`);
    const user = await User.findById(userId);
    if (!user)
      throw new ApiError(
        httpStatusCodes.NOT_FOUND,
        "User not found to create store profile.",
      );
    if (!user.roles.includes("seller"))
      throw new ApiError(httpStatusCodes.FORBIDDEN, "User is not a seller.");

    const newProfile = new SellerProfile({
      ...updateData,
      userId,
      verificationStatus: profile
        ? profile.verificationStatus
        : user.roles.includes("seller")
          ? "approved"
          : "not_applied", // Retain existing status or set based on role
    });
    if (updateData.businessAddressId) {
      const address = await Address.findOne({
        _id: updateData.businessAddressId,
        userId,
      });
      if (!address || address.addressType !== "business") {
        throw new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid business address ID or address type is not 'business'.",
        );
      }
    }
    await newProfile.save();
    return newProfile.populate("businessAddressId");
  }

  // If profile exists, update it
  if (updateData.businessAddressId) {
    const address = await Address.findOne({
      _id: updateData.businessAddressId,
      userId,
    });
    if (!address || address.addressType !== "business") {
      // Allow unsetting by passing null
      if (updateData.businessAddressId !== null) {
        throw new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid business address ID or address type is not 'business'.",
        );
      }
    }
  }

  Object.assign(profile, updateData);
  await profile.save();
  return profile.populate("businessAddressId");
};

/**
 * (Admin) Lists all seller applications.
 * @param {typeof import('../dtos/admin.dto.js').listSellerApplicationsQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<Object>} Paginated seller applications.
 */
const listAllSellerApplications = async (queryOptions) => {
  const { page, limit, status, userId } = queryOptions;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (userId) filter.userId = userId;

  const skip = (page - 1) * limit;
  const applications = await SellerApplication.find(filter)
    .populate("userId", "firstName lastName email")
    .populate("adminReviewerId", "firstName lastName email")
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await SellerApplication.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  return { results: applications, page, limit, totalPages, totalResults };
};

/**
 * (Admin) Approves a seller application.
 * @param {string} adminId - ID of the admin performing the action.
 * @param {string} applicationId - ID of the seller application.
 * @returns {Promise<InstanceType<typeof SellerApplication>>} Updated application.
 */
const approveSellerApplication = async (adminId, applicationId) => {
  const application = await SellerApplication.findById(applicationId);
  if (!application)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Seller application not found.",
    );
  if (application.status === "approved")
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Application already approved.",
    );

  application.status = "approved";
  application.adminReviewerId = adminId;
  application.reviewedAt = new Date();
  await application.save();

  // Promote user to seller and create/update SellerProfile
  const user = await User.findById(application.userId);
  if (user) {
    if (!user.roles.includes("seller")) {
      user.roles.push("seller");
      await user.save();
    }
    let sellerProfile = await SellerProfile.findOne({
      userId: application.userId,
    });
    if (!sellerProfile) {
      sellerProfile = await SellerProfile.create({
        userId: application.userId,
        storeName: application.proposedStoreName, // Use proposed name
        verificationStatus: "approved",
        joinedAsSellerAt: new Date(),
      });
    } else {
      sellerProfile.verificationStatus = "approved";
      if (!sellerProfile.storeName)
        sellerProfile.storeName = application.proposedStoreName;
      sellerProfile.joinedAsSellerAt =
        sellerProfile.joinedAsSellerAt || new Date();
      await sellerProfile.save();
    }
    logger.info(
      `User ${application.userId} approved as seller. Profile updated/created.`,
    );
  } else {
    logger.error(
      `User ${application.userId} not found during seller application approval for application ${applicationId}.`,
    );
  }
  // TODO: Notify applicant.
  return application;
};

/**
 * (Admin) Rejects a seller application.
 * @param {string} adminId - ID of the admin performing the action.
 * @param {string} applicationId - ID of the seller application.
 * @param {string} reason - Reason for rejection.
 * @returns {Promise<InstanceType<typeof SellerApplication>>} Updated application.
 */
const rejectSellerApplication = async (adminId, applicationId, reason) => {
  const application = await SellerApplication.findById(applicationId);
  if (!application)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Seller application not found.",
    );
  if (application.status === "rejected")
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Application already rejected.",
    );

  application.status = "rejected";
  application.adminReviewerId = adminId;
  application.reviewedAt = new Date();
  application.reviewNotes = reason;
  await application.save();
  // TODO: Notify applicant.
  return application;
};

export const sellerService = {
  applyToBeSeller,
  getOrCreateStoreProfile,
  updateStoreProfile,
  listAllSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
};
