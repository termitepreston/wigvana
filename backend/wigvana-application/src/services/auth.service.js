import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "node:crypto";
import httpStatusCodes from "http-status-codes";
import User from "../models/User.model.js";
import { redisService } from "./redis.service.js";
import config from "../config/index.js";
import ApiError from "../errors/ApiError.js";
import logger from "../utils/logger.js";
// import { mailService } from './mail.service.js'; // For actual email sending

/**
 * Generates JWT access and refresh tokens.
 * @param {string} userId - The user's ID.
 * @returns {{accessToken: string, refreshToken: string}} The generated tokens.
 */
const generateTokens = (userId) => {
	const accessToken = jwt.sign({ sub: userId }, config.JWT_SECRET, {
		expiresIn: `${config.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES}m`,
	});
	const refreshToken = jwt.sign(
		{ sub: userId, type: "refresh" },
		config.JWT_SECRET,
		{
			expiresIn: `${config.JWT_REFRESH_TOKEN_EXPIRATION_DAYS}d`,
		},
	);
	return { accessToken, refreshToken };
};

/**
 * Saves refresh token to Redis.
 * @param {string} userId - The user's ID.
 * @param {string} token - The refresh token.
 * @returns {Promise<void>}
 */
const saveRefreshTokenToRedis = async (userId, token) => {
	const key = `refreshToken:${userId}:${crypto.createHash("sha256").update(token).digest("hex").slice(0, 16)}`;
	await redisService.set(
		key,
		"true",
		config.JWT_REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60,
	);
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token.
 * @param {string} secret - The JWT secret.
 * @returns {Promise<jwt.JwtPayload | string>} The decoded payload or throws an error.
 */
const verifyToken = async (token, secret) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (err, decoded) => {
			if (err) {
				return reject(
					new ApiError(
						httpStatusCodes.UNAUTHORIZED,
						"Invalid or expired token",
					),
				);
			}
			resolve(decoded);
		});
	});
};

/**
 * Registers a new user.
 * @param {typeof import('../dtos/auth.dto.js').registerUserDtoSchema._input.body} userData - User registration data.
 * @returns {Promise<{user: InstanceType<typeof User>, accessToken: string, refreshToken: string}>}
 */
const registerUser = async (userData) => {
	if (await User.findOne({ email: userData.email })) {
		throw new ApiError(httpStatusCodes.BAD_REQUEST, "Email already taken");
	}

	const hashedPassword = await bcrypt.hash(userData.password, 10); // Hash here, not in model pre-save directly from DTO

	const verificationToken = crypto.randomBytes(32).toString("hex");
	const emailVerificationTokenExpiresAt = new Date(
		Date.now() + 24 * 60 * 60 * 1000,
	); // 24 hours

	const user = await User.create({
		...userData,
		passwordHash: hashedPassword, // Store hashed password
		emailVerificationToken: verificationToken,
		emailVerificationTokenExpiresAt,
		accountStatus: "pending_verification",
	});

	const { accessToken, refreshToken } = generateTokens(user.id);
	await saveRefreshTokenToRedis(user.id, refreshToken);

	// For development: Log verification link
	const verificationLink = `${config.APP_BASE_URL}/api/v1/auth/verify-email?token=${verificationToken}`;
	logger.info(`Email verification link for ${user.email}: ${verificationLink}`);
	// In production: await mailService.sendVerificationEmail(user.email, verificationToken);

	// Don't send sensitive fields back
	const userResponse = user.toObject();
	userResponse.passwordHash = undefined;
	userResponse.emailVerificationToken = undefined;
	userResponse.emailVerificationTokenExpiresAt = undefined;

	return { user: userResponse, accessToken, refreshToken };
};

/**
 * Logs in an existing user.
 * @param {typeof import('../dtos/auth.dto.js').loginUserDtoSchema._input.body} loginData - User login data.
 * @returns {Promise<{user: InstanceType<typeof User>, accessToken: string, refreshToken: string}>}
 */
const loginUser = async (loginData) => {
	const user = await User.findOne({ email: loginData.email });

	if (!user || !(await user.comparePassword(loginData.password))) {
		throw new ApiError(
			httpStatusCodes.UNAUTHORIZED,
			"Incorrect email or password",
		);
	}

	if (!user.emailVerified) {
		throw new ApiError(
			httpStatusCodes.FORBIDDEN,
			"Email not verified. Please check your inbox for a verification link.",
		);
	}
	if (user.accountStatus !== "active") {
		throw new ApiError(
			httpStatusCodes.FORBIDDEN,
			`Account is ${user.accountStatus}. Please contact support.`,
		);
	}

	const { accessToken, refreshToken } = generateTokens(user.id);
	await saveRefreshTokenToRedis(user.id, refreshToken);

	user.lastLoginAt = new Date();
	await user.save();

	const userResponse = user.toObject();
	userResponse.passwordHash = undefined;

	return { user: userResponse, accessToken, refreshToken };
};

/**
 * Refreshes an access token using a refresh token.
 * @param {string} oldRefreshToken - The refresh token from cookies.
 * @returns {Promise<{accessToken: string}>}
 */
const refreshAccessToken = async (oldRefreshToken) => {
	try {
		const payload = await verifyToken(oldRefreshToken, config.JWT_SECRET);
		if (
			typeof payload === "string" ||
			!payload.sub ||
			payload.type !== "refresh"
		) {
			throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Invalid refresh token");
		}

		const userId = payload.sub;
		const tokenHash = crypto
			.createHash("sha256")
			.update(oldRefreshToken)
			.digest("hex")
			.slice(0, 16);
		const redisKey = `refreshToken:${userId}:${tokenHash}`;

		const tokenExists = await redisService.get(redisKey);
		if (!tokenExists) {
			throw new ApiError(
				httpStatusCodes.UNAUTHORIZED,
				"Refresh token not found or revoked",
			);
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new ApiError(httpStatusCodes.UNAUTHORIZED, "User not found");
		}
		if (user.accountStatus !== "active") {
			await redisService.del(redisKey); // Revoke token if account is not active
			throw new ApiError(
				httpStatusCodes.FORBIDDEN,
				`Account is ${user.accountStatus}.`,
			);
		}

		const { accessToken } = generateTokens(userId); // Only new access token
		return { accessToken };
	} catch (error) {
		// If any error during refresh (e.g. token expired, not found in redis), throw Unauthorized
		if (
			error instanceof ApiError &&
			error.statusCode === httpStatusCodes.UNAUTHORIZED
		)
			throw error;
		throw new ApiError(httpStatusCodes.UNAUTHORIZED, "Could not refresh token");
	}
};

/**
 * Logs out a user by invalidating their refresh token.
 * @param {string} refreshToken - The refresh token to invalidate.
 * @param {string} userId - The ID of the user logging out (from access token usually).
 * @returns {Promise<void>}
 */
const logoutUser = async (refreshToken, userId) => {
	// It's crucial that the userId here is trustworthy (e.g., from a validated access token if available)
	// or derived from the refresh token itself if it's self-contained and verified.
	// For simplicity, we assume userId can be obtained or the refresh token itself contains it.

	// If userId is not passed, try to decode it from refresh token (less secure if token isn't validated first)
	let effectiveUserId = userId;
	if (!effectiveUserId && refreshToken) {
		try {
			const payload = await verifyToken(refreshToken, config.JWT_SECRET); // Basic verification
			if (typeof payload !== "string" && payload.sub) {
				effectiveUserId = payload.sub;
			}
		} catch (e) {
			// If token is invalid, nothing to do in Redis anyway for that specific token
			logger.warn("Logout attempt with invalid refresh token.");
			return;
		}
	}

	if (!effectiveUserId || !refreshToken) {
		logger.warn("Logout attempt without sufficient token information.");
		return; // Can't proceed without user ID and token
	}

	const tokenHash = crypto
		.createHash("sha256")
		.update(refreshToken)
		.digest("hex")
		.slice(0, 16);
	const redisKey = `refreshToken:${effectiveUserId}:${tokenHash}`;
	await redisService.del(redisKey);
};

/**
 * Verifies user email.
 * @param {string} token - The email verification token.
 * @returns {Promise<void>}
 */
const verifyEmail = async (token) => {
	const user = await User.findOne({
		emailVerificationToken: token,
		emailVerificationTokenExpiresAt: { $gt: new Date() },
	});

	if (!user) {
		throw new ApiError(
			httpStatusCodes.BAD_REQUEST,
			"Invalid or expired email verification token.",
		);
	}

	user.emailVerified = true;
	user.emailVerificationToken = undefined;
	user.emailVerificationTokenExpiresAt = undefined;
	user.accountStatus = "active"; // Activate account
	await user.save();
};

export const authService = {
	registerUser,
	loginUser,
	refreshAccessToken,
	logoutUser,
	verifyEmail,
	// ... other auth methods (password reset, etc.)
};
