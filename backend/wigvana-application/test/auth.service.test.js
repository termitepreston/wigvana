import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { RedisContainer } from "@testcontainers/redis";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import {
	generateTokens,
	storeRefreshToken,
} from "../src/services/auth.service.js";

let container;
let redis;

const TIME_OUT = 10 * 60 * 1000;

beforeAll(async () => {
	container = await new RedisContainer().start();

	redis = new Redis(container.getConnectionUrl());
}, TIME_OUT);

afterAll(async () => {
	await redis.quit();
	await container.stop();
});

afterEach(async () => {
	await redis.flushdb();
});

describe("Token service.", () => {
	it("Should return the same payload when that payload is signed with the same key.", async () => {
		const payload = {
			userId: 1,
			roles: ["admin"],
		};

		const { accessToken, refreshToken } = generateTokens(payload);

		expect(accessToken).toBeTruthy();
		expect(refreshToken).toBeTruthy();

		expect(jwt.decode(accessToken)).toHaveProperty("userId", 1);
		expect(jwt.decode(accessToken)).toHaveProperty("roles", ["admin"]);

		expect(jwt.decode(refreshToken)).toHaveProperty("userId", 1);
	});

	it("Should return a valid token from redis when queried after store", async () => {
		const user = {
			userId: 1,
			roles: ["admin", "buyer"],
		};

		const token = generateTokens(user).refreshToken;

		await redis.set(user.userId, token, "EX", 60 * 60 * 24 * 7); // 7 days.

		const retToken = await redis.get(user.userId);

		expect(retToken).toBe(token);
	});
});
