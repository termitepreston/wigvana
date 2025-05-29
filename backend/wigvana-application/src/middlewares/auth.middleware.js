import jwt from "jsonwebtoken";
import httpStatusCodes from "http-status-codes";
import config from "../config/index.js";
import User from "../models/User.model.js";
import ApiError from "../errors/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * @description Middleware to protect routes by verifying JWT access token.
 * Attaches user object to request if token is valid.
 * @type {import('express').RequestHandler}
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(
      httpStatusCodes.UNAUTHORIZED,
      "Not authorized, no token",
    );
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (typeof decoded === "string" || !decoded.sub) {
      throw new ApiError(
        httpStatusCodes.UNAUTHORIZED,
        "Not authorized, token failed",
      );
    }

    const currentUser = await User.findById(decoded.sub).select(
      "-passwordHash",
    ); // Exclude password
    if (!currentUser) {
      throw new ApiError(
        httpStatusCodes.UNAUTHORIZED,
        "User belonging to this token does no longer exist",
      );
    }
    if (currentUser.accountStatus !== "active") {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        `Account is ${currentUser.accountStatus}. Access denied.`,
      );
    }

    req.user = currentUser; // Attach user to request object
    next();
  } catch (error) {
    // Handle specific JWT errors like TokenExpiredError, JsonWebTokenError
    if (error.name === "TokenExpiredError") {
      throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid token");
    }
    // Rethrow other ApiErrors or create a new one
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatusCodes.UNAUTHORIZED,
      "Not authorized, token failed",
    );
  }
});

/**
 * @description Middleware to authorize users based on their roles.
 * @param {string[]} requiredRoles - Array of roles allowed to access the route.
 * @returns {import('express').RequestHandler}
 */
export const authorize = (requiredRoles) => (req, res, next) => {
  if (!req.user || !req.user.roles) {
    throw new ApiError(
      httpStatusCodes.UNAUTHORIZED,
      "Not authorized for this resource",
    );
  }

  const hasRequiredRole = req.user.roles.some((role) =>
    requiredRoles.includes(role),
  );

  if (!hasRequiredRole) {
    throw new ApiError(
      httpStatusCodes.FORBIDDEN,
      "You do not have permission to perform this action",
    );
  }
  next();
};
