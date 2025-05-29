import httpStatusCodes from "http-status-codes";
import { authService } from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const register = catchAsync(async (req, res) => {
	const { user, accessToken, refreshToken } = await authService.registerUser(
		req.body,
	);
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.NODE_ENV === "production", // Use secure cookies in production
		sameSite: "strict",
		maxAge: config.JWT_REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
	});
	res.status(httpStatusCodes.CREATED).send({ user, accessToken });
});

const login = catchAsync(async (req, res) => {
	const { user, accessToken, refreshToken } = await authService.loginUser(
		req.body,
	);
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: config.JWT_REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
	});
	res.status(httpStatusCodes.OK).send({ user, accessToken });
});

const logout = catchAsync(async (req, res) => {
	const refreshToken = req.cookies.refreshToken;
	// Assuming `req.user.id` is populated by an auth middleware if an access token was present
	// If not, the service should handle deriving userId from refreshToken if possible
	const userId = req.user ? req.user.id : undefined;

	if (refreshToken) {
		await authService.logoutUser(refreshToken, userId);
	}
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: config.NODE_ENV === "production",
		sameSite: "strict",
	});
	res.status(httpStatusCodes.OK).send({ message: "Logged out successfully" });
});

const refreshTokens = catchAsync(async (req, res) => {
	const oldRefreshToken = req.cookies.refreshToken;
	if (!oldRefreshToken) {
		return res
			.status(httpStatusCodes.UNAUTHORIZED)
			.send({ message: "Refresh token not found" });
	}
	const { accessToken } = await authService.refreshAccessToken(oldRefreshToken);
	res.status(httpStatusCodes.OK).send({ accessToken });
});

const verifyEmail = catchAsync(async (req, res) => {
	const { token } = req.query;
	if (!token || typeof token !== "string") {
		return res
			.status(httpStatusCodes.BAD_REQUEST)
			.send({ message: "Verification token is required." });
	}
	await authService.verifyEmail(token);
	// Redirect to a success page or send a success message
	// For an API, a message is usually fine.
	res
		.status(httpStatusCodes.OK)
		.send({ message: "Email verified successfully. You can now log in." });
});

export const authController = {
	register,
	login,
	logout,
	refreshTokens,
	verifyEmail,
};
