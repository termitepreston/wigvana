import httpStatusCodes from "http-status-codes";
import { userService } from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Controller to get the current user's profile.
 * @type {import('express').RequestHandler}
 */
const getMyProfile = catchAsync(async (req, res) => {
	// req.user is populated by the 'protect' middleware
	const user = await userService.getUserProfile(req.user.id);
	res.status(httpStatusCodes.OK).send(user);
});

/**
 * Controller to update the current user's profile.
 * @type {import('express').RequestHandler}
 */
const updateMyProfile = catchAsync(async (req, res) => {
	const updatedUser = await userService.updateUserProfile(
		req.user.id,
		req.body,
	);
	res.status(httpStatusCodes.OK).send(updatedUser);
});

/**
 * Controller to change the current user's password.
 * @type {import('express').RequestHandler}
 */
const changeMyPassword = catchAsync(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	await userService.changePassword(req.user.id, currentPassword, newPassword);
	res
		.status(httpStatusCodes.OK)
		.send({ message: "Password changed successfully." });
});

/**
 * Controller to delete the current user's account.
 * @type {import('express').RequestHandler}
 */
const deleteMyAccount = catchAsync(async (req, res) => {
	await userService.deleteUserAccount(req.user.id);
	// Client should also clear tokens and redirect to login/home
	// Clearing the refresh token cookie can be done here too, similar to logout.
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});
	res
		.status(httpStatusCodes.OK)
		.send({ message: "Account deleted successfully." });
});

export const userController = {
	getMyProfile,
	updateMyProfile,
	changeMyPassword,
	deleteMyAccount,
};
