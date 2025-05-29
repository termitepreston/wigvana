import User from "../models/User.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import bcrypt from "bcryptjs";
import SellerProfile from "../models/SellerProfile.model.js";
import { redisService } from "./redis.service.js";
import logger from "../utils/logger.js";

/**
 * Gets the profile of the currently authenticated user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<InstanceType<typeof User>>} The user document (excluding sensitive fields).
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "-passwordHash -emailVerificationToken -passwordResetToken",
  ); // Exclude sensitive fields
  if (!user) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  }
  return user;
};

/**
 * Updates the profile of the currently authenticated user.
 * @param {string} userId - The ID of the user to update.
 * @param {typeof import('../dtos/user.dto.js').updateUserProfileSchema._input.body} updateData - Data to update.
 * @returns {Promise<InstanceType<typeof User>>} The updated user document.
 */
const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  }

  for (const key of Object.keys(updateData)) {
    if (updateData[key] !== undefined) {
      // Check for undefined to allow setting fields to null
      user[key] = updateData[key];
    }
  }

  await user.save();
  // Return user without sensitive fields
  const updatedUser = user.toObject();
  updatedUser.passwordHash = undefined;
  updatedUser.emailVerificationToken = undefined;
  updatedUser.passwordResetToken = undefined;
  return updatedUser;
};

/**
 * Changes the password for the currently authenticated user.
 * @param {string} userId - The ID of the user.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<void>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId); // Need to fetch with passwordHash
  if (!user) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Incorrect current password.",
    );
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "New password must be different from the current password.",
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Optional: Invalidate all refresh tokens for this user for security
  // This requires a more complex Redis setup (e.g., storing all tokens or using a version/timestamp)
  // For now, we'll skip this, but it's a good security practice.
  // Example: await redisService.del(`refreshTokens:${userId}:*`);
};

/**
 * Deletes the account of the currently authenticated user.
 * (Soft delete by changing status, or hard delete based on policy)
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>}
 */
const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  }

  // Option 1: Soft delete (recommended)
  user.accountStatus = "deactivated";
  user.email = `${user.email}.deleted.${Date.now()}`; // Anonymize email to allow re-registration
  // Consider clearing personal data fields or marking them as anonymized
  await user.save();

  // Option 2: Hard delete (use with caution)
  // await User.findByIdAndDelete(userId);

  // Invalidate all refresh tokens for this user
  // This is more critical for account deletion
  // await redisService.del(`refreshTokens:${userId}:*`); // Requires pattern deletion in Redis
  // Or iterate and delete tokens if stored individually with a prefix.
  // For now, we assume logout will handle the current refresh token.
  // A more robust solution would be needed for full session invalidation.
};

/**
 * (Admin) Lists all users with pagination and filtering.
 * @param {typeof import('../dtos/admin.dto.js').listUsersQuerySchema._input.query} queryOptions - Options.
 * @returns {Promise<Object>} Paginated users.
 */
const listAllUsers = async (queryOptions) => {
  const { page, limit, role, status, search } = queryOptions;
  const filter = {};

  if (role && role !== "all") filter.roles = role;
  if (status && status !== "all") filter.accountStatus = status;
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const users = await User.find(filter)
    .select("-passwordHash -emailVerificationToken -passwordResetToken") // Exclude sensitive
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  return { results: users, page, limit, totalPages, totalResults };
};

/**
 * (Admin) Gets details of a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<InstanceType<typeof User>>} User document.
 */
const adminGetUserById = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  return user;
};

/**
 * (Admin) Updates a user's profile details or roles.
 * @param {string} userId - The ID of the user to update.
 * @param {typeof import('../dtos/admin.dto.js').adminUpdateUserSchema._input.body} updateData - Data.
 * @returns {Promise<InstanceType<typeof User>>} Updated user document.
 */
const adminUpdateUser = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");

  // Handle specific fields like email change (might need re-verification logic)
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      email: updateData.email,
      _id: { $ne: userId },
    });
    if (existingUser)
      throw new ApiError(httpStatusCodes.BAD_REQUEST, "Email already taken.");
    user.email = updateData.email;
    user.emailVerified = false; // Force re-verification if email changes
    // TODO: Trigger new email verification flow
    logger.info(
      `Admin changed email for user ${userId} to ${updateData.email}. Re-verification needed.`,
    );
  }

  if (updateData.roles) user.roles = updateData.roles;
  if (updateData.accountStatus) user.accountStatus = updateData.accountStatus;
  if (typeof updateData.emailVerified === "boolean")
    user.emailVerified = updateData.emailVerified;
  if (updateData.firstName) user.firstName = updateData.firstName;
  if (updateData.lastName) user.lastName = updateData.lastName;

  // If role 'seller' is added and no SellerProfile exists, or if isVerifiedSeller is managed here:
  if (updateData.roles?.includes("seller")) {
    let sellerProfile = await SellerProfile.findOne({ userId });
    if (!sellerProfile) {
      sellerProfile = await SellerProfile.create({
        userId,
        storeName: `${user.firstName}'s Store (Admin Created)`, // Default
        verificationStatus: "approved", // Admin is adding role, assume approved
      });
      logger.info(
        `Admin created SellerProfile for user ${userId} due to role update.`,
      );
    } else if (sellerProfile.verificationStatus !== "approved") {
      // If admin sets role to seller, ensure profile is also approved
      sellerProfile.verificationStatus = "approved";
      await sellerProfile.save();
    }
  }

  await user.save();
  return adminGetUserById(userId); // Fetch again to get clean version
};

/**
 * (Admin) Suspends a user account.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<InstanceType<typeof User>>} Updated user document.
 */
const suspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  if (user.roles.includes("admin"))
    throw new ApiError(
      httpStatusCodes.FORBIDDEN,
      "Cannot suspend an admin account.",
    );

  user.accountStatus = "suspended";
  await user.save();
  // TODO: Invalidate user's sessions/tokens
  return adminGetUserById(userId);
};

/**
 * (Admin) Unsuspends a user account.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<InstanceType<typeof User>>} Updated user document.
 */
const unsuspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatusCodes.NOT_FOUND, "User not found.");
  // If previously suspended, set to active. If pending_verification, keep as is.
  if (user.accountStatus === "suspended") {
    user.accountStatus = "active";
  }
  await user.save();
  return adminGetUserById(userId);
};

export const userService = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  listAllUsers,
  adminGetUserById,
  adminUpdateUser,
  suspendUser,
  unsuspendUser,
};
