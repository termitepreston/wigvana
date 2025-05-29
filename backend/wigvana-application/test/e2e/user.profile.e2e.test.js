import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import { authService } from "../../src/services/auth.service.js"; // To generate tokens for tests
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

describe("User Profile (Me) Endpoints", () => {
	let testUser;
	let accessToken;
	let refreshTokenCookie;

	const setupUserAndLogin = async (userData) => {
		const user = await User.create(userData);
		// Manually generate tokens for test user as if they logged in
		const { accessToken: token, refreshToken } = authService.generateTokens(
			user._id,
		); // Assuming authService has generateTokens
		await authService.saveRefreshTokenToRedis(user._id, refreshToken); // Assuming authService has saveRefreshTokenToRedis

		return {
			user,
			accessToken: token,
			refreshTokenCookie: `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Strict`, // Mimic cookie
		};
	};

	beforeAll(async () => {
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(global.testConfig.MONGO_URI, {
				directConnection: true,
			});
		}
	});

	afterAll(async () => {
		await mongoose.disconnect();
		if (redisService.client && redisService.client.status === "ready") {
			await redisService.client.quit();
		}
	});

	beforeEach(async () => {
		await User.deleteMany({});
		await redisService.client.flushdb(); // Clear redis

		const rawPassword = "password123";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		const setup = await setupUserAndLogin({
			firstName: "Test",
			lastName: "User",
			email: `me-${uuidv4()}@example.com`,
			passwordHash: hashedPassword, // Pre-hash for direct creation
			emailVerified: true,
			accountStatus: "active",
		});
		testUser = setup.user;
		accessToken = setup.accessToken;
		// No need for refreshTokenCookie for these tests as they use Bearer token
	});

	describe("GET /api/v1/me", () => {
		it("should get current user profile", async () => {
			const res = await request
				.get("/api/v1/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.expect(200);

			expect(res.body.id).toBe(testUser._id.toString());
			expect(res.body.email).toBe(testUser.email);
			expect(res.body.passwordHash).toBeUndefined();
		});

		it("should return 401 if no token is provided", async () => {
			await request.get("/api/v1/me").expect(401);
		});
	});

	describe("PATCH /api/v1/me", () => {
		it("should update current user profile", async () => {
			const updateData = {
				firstName: "UpdatedFirst",
				lastName: "UpdatedLast",
				phoneNumber: "+11234567890",
			};
			const res = await request
				.patch("/api/v1/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.send(updateData)
				.expect(200);

			expect(res.body.firstName).toBe(updateData.firstName);
			expect(res.body.lastName).toBe(updateData.lastName);
			expect(res.body.phoneNumber).toBe(updateData.phoneNumber);

			const dbUser = await User.findById(testUser._id);
			expect(dbUser.firstName).toBe(updateData.firstName);
		});

		it("should return 400 for invalid update data", async () => {
			await request
				.patch("/api/v1/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({ firstName: "" }) // Invalid: too short
				.expect(400);
		});
	});

	describe("POST /api/v1/me/password", () => {
		it("should change current user password", async () => {
			const passwordData = {
				currentPassword: "password123",
				newPassword: "newPassword456",
			};
			await request
				.post("/api/v1/me/password")
				.set("Authorization", `Bearer ${accessToken}`)
				.send(passwordData)
				.expect(200);

			// Verify new password by trying to login (conceptually)
			const user = await User.findById(testUser._id);
			const isMatch = await user.comparePassword(passwordData.newPassword);
			expect(isMatch).toBe(true);
		});

		it("should return 400 for incorrect current password", async () => {
			await request
				.post("/api/v1/me/password")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({
					currentPassword: "wrongPassword",
					newPassword: "newPassword456",
				})
				.expect(400);
		});

		it("should return 400 if new password is same as current", async () => {
			await request
				.post("/api/v1/me/password")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({ currentPassword: "password123", newPassword: "password123" })
				.expect(400);
		});
	});

	describe("DELETE /api/v1/me", () => {
		it("should delete current user account (soft delete)", async () => {
			await request
				.delete("/api/v1/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.expect(200);

			const dbUser = await User.findById(testUser._id);
			expect(dbUser.accountStatus).toBe("deactivated");
			expect(dbUser.email).toContain(".deleted.");
		});
	});
});
