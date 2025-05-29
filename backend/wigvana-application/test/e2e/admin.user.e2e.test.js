import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import SellerProfile from "../../src/models/SellerProfile.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	if (res.body?.accessToken) {
		return res.body.accessToken;
	}
	throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
};

describe("Admin User Management Endpoints (/admin/users)", () => {
	let adminUser;
	let adminToken;
	let regularUser1;
	let regularUser2AsSeller;

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
		await SellerProfile.deleteMany({}); // Clear seller profiles too
		await redisService.client.flushdb();

		const adminPassword = "adminSecurePass";
		adminUser = await User.create({
			firstName: "Platform",
			lastName: "Admin",
			email: `admin-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash(adminPassword, 10),
			roles: ["admin", "buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		adminToken = await loginUserAndGetToken(adminUser.email, adminPassword);

		regularUser1 = await User.create({
			firstName: "Regular",
			lastName: "BuyerUser",
			email: `buyer-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash("userPass1", 10),
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		regularUser2AsSeller = await User.create({
			firstName: "Test",
			lastName: "SellerUser",
			email: `seller-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash("userPass2", 10),
			roles: ["seller", "buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		await SellerProfile.create({
			userId: regularUser2AsSeller._id,
			storeName: "Seller Store",
			verificationStatus: "approved",
		});
	});

	describe("GET /api/v1/admin/users", () => {
		it("should list all users for admin", async () => {
			const res = await request
				.get("/api/v1/admin/users")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);
			// Admin, regularUser1, regularUser2AsSeller
			expect(res.body.results.length).toBe(3);
		});

		it('should filter users by role "seller"', async () => {
			const res = await request
				.get("/api/v1/admin/users?role=seller")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].email).toBe(regularUser2AsSeller.email);
		});

		it("should be forbidden for non-admin user", async () => {
			const buyerToken = await loginUserAndGetToken(
				regularUser1.email,
				"userPass1",
			);
			await request
				.get("/api/v1/admin/users")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(403);
		});
	});

	describe("GET /api/v1/admin/users/:userId", () => {
		it("should get details of a specific user for admin", async () => {
			const res = await request
				.get(`/api/v1/admin/users/${regularUser1._id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);
			expect(res.body.email).toBe(regularUser1.email);
		});
	});

	describe("PATCH /api/v1/admin/users/:userId", () => {
		it("should allow admin to update user roles and status", async () => {
			const updateData = {
				roles: ["buyer", "seller"],
				accountStatus: "suspended",
			};
			const res = await request
				.patch(`/api/v1/admin/users/${regularUser1._id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(updateData)
				.expect(200);

			expect(res.body.roles).toEqual(
				expect.arrayContaining(["buyer", "seller"]),
			);
			expect(res.body.accountStatus).toBe("suspended");
			const dbUser = await User.findById(regularUser1._id);
			expect(dbUser.roles).toContain("seller");

			// Check if SellerProfile was created/updated
			const sellerProfile = await SellerProfile.findOne({
				userId: regularUser1._id,
			});
			expect(sellerProfile).not.toBeNull();
			expect(sellerProfile.verificationStatus).toBe("approved");
		});
	});

	describe("POST /api/v1/admin/users/:userId/suspend & /unsuspend", () => {
		it("should allow admin to suspend a user", async () => {
			const res = await request
				.post(`/api/v1/admin/users/${regularUser1._id}/suspend`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);
			expect(res.body.accountStatus).toBe("suspended");
		});

		it("should not allow admin to suspend another admin", async () => {
			const otherAdmin = await User.create({
				firstName: "OtherAdmin",
				lastName: "A",
				email: `oa-${uuidv4()}@example.com`,
				passwordHash: "p",
				roles: ["admin"],
			});
			await request
				.post(`/api/v1/admin/users/${otherAdmin._id}/suspend`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(403); // Forbidden
		});

		it("should allow admin to unsuspend a user", async () => {
			await User.findByIdAndUpdate(regularUser1._id, {
				accountStatus: "suspended",
			});
			const res = await request
				.post(`/api/v1/admin/users/${regularUser1._id}/unsuspend`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);
			expect(res.body.accountStatus).toBe("active");
		});
	});
});
