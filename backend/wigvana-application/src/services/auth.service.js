import jwt from "jsonwebtoken";
import config from "../config/index.js";
import redis from "./redis.service.js";

export const generateTokens = (payload) => {
	const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
		expiresIn: config.jwt.accessExpiry,
	});

	const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
		expiresIn: config.jwt.refreshExpiry,
	});

	return { accessToken, refreshToken };
};

export const storeRefreshToken = async (userId, token) => {
	await redis.set(userId, token, "EX", 60 * 60 * 24 * 7); // 7 days.
};

export const verifyRefreshToken = async (userId, token) => {
	const storedToken = await redis.get(userId);

	return storedToken === token;
};

export const removeRefreshToken = async (userId) => {
	await redis.del(userId);
};
