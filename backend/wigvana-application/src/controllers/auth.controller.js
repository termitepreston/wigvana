import User from "../models/user.model.js";
import * as authService from "../services/auth.service.js";
import jwt from "jsonwebtoken";

import config from "../config/index.js";

class UserExistsError extends Error {
	constructor(message) {
		super(message);
		this.message = message;
	}
}

class UnauthorizedError extends Error {
	constructor(message) {
		super(message);
		this.message = message;
	}
}

class NotFound extends Error {
	constructor(message) {
		super(message);
		this.message = message;
	}
}

class BadRequest extends Error {
	constructor(message) {
		super(message);
		this.message = message;
	}
}

export const register = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const existingUser = await User.findOne({ email });

		if (existingUser) throw new UserExistsError("Email already exists.");

		const user = new User({ email, password });
		await user.save();

		res.status(201).json({ id: user._id, email: user.email });
		await user.save();
	} catch (error) {
		next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) throw NotFound("User not found.");

		const isValid = await user.comparePassword(password);
		if (!isValid) throw UnauthorizedError("Invalid credentials.");

		const { accessToken, refreshToken } = authService.generateTokens({
			userId: user._id,
		});

		await authService.storeRefreshToken(user._id.toString(), refreshToken);

		res.cookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.json({ accessToken });
	} catch (error) {
		next(error);
	}
};

export const refresh = async (req, res, next) => {
	try {
		const { refreshToken } = req.cookies;
		if (!refreshToken) throw UnauthorizedError();

		const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
		const isValid = await authService.verifyRefreshToken(
			payload.userId,
			refreshToken,
		);
		if (!isValid) throw new UnauthorizedError();

		const { accessToken, refreshToken: newRefreshToken } =
			authService.generateTokens({
				userId: payload.userId,
			});

		await authService.storeRefreshToken(payload.userId, newRefreshToken);

		res.cookie("refreshToken", newRefreshToken, {
			/* same options */
		});
		res.json({ accessToken });
	} catch (error) {
		next(error);
	}
};

export const logout = async (req, res, next) => {
	try {
		const { refreshToken } = req.cookies;
		if (!refreshToken) throw BadRequest();

		const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
		await authService.removeRefreshToken(payload.userId);

		res.clearCookie("refreshToken");
		res.sendStatus(204);
	} catch (error) {
		next(error);
	}
};
