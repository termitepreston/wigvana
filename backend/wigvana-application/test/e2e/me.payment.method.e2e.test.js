import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import PaymentMethod from "../../src/models/PaymentMethod.model.js";
import Address from "../../src/models/Address.model.js"; // For billingAddressId
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Buyer Payment Method Endpoints (/me/payment-methods)", () => {
	let buyerUser;
	let buyerToken;
	let billingAddress;

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
		await PaymentMethod.deleteMany({});
		await Address.deleteMany({});
		await redisService.client.flushdb();

		const rawPassword = "paymentUserPass";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		buyerUser = await User.create({
			firstName: "Pay",
			lastName: "User",
			email: `pay-${uuidv4()}@example.com`,
			passwordHash: hashedPassword,
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		buyerToken = await loginUserAndGetToken(buyerUser.email, rawPassword);

		billingAddress = await Address.create({
			userId: buyerUser._id,
			addressLine1: "1 Billing Rd",
			city: "Billville",
			stateProvinceRegion: "BL",
			postalCode: "54321",
			country: "US",
			addressType: "billing",
		});
	});

	const paymentMethodData = {
		paymentToken: `pm_tok_${uuidv4()}`, // Simulated Stripe-like token
		type: "card",
		cardBrand: "visa",
		lastFourDigits: "4242",
		expirationMonth: 12,
		expirationYear: new Date().getFullYear() + 2,
	};

	describe("POST /api/v1/me/payment-methods", () => {
		it("should add a new payment method", async () => {
			const res = await request
				.post("/api/v1/me/payment-methods")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({
					...paymentMethodData,
					billingAddressId: billingAddress._id,
					isDefault: true,
				})
				.expect(201);

			expect(res.body.type).toBe(paymentMethodData.type);
			expect(res.body.userId).toBe(buyerUser._id.toString());
			expect(res.body.isDefault).toBe(true);
			expect(res.body.billingAddressId).toBe(billingAddress._id.toString());
		});

		it("should not allow adding with non-existent billingAddressId", async () => {
			await request
				.post("/api/v1/me/payment-methods")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ ...paymentMethodData, billingAddressId: uuidv4() })
				.expect(400); // Or specific error for address not found
		});
	});

	describe("GET /api/v1/me/payment-methods", () => {
		it("should list buyer's payment methods", async () => {
			await PaymentMethod.create({
				...paymentMethodData,
				userId: buyerUser._id,
			});
			const res = await request
				.get("/api/v1/me/payment-methods")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.length).toBe(1);
			expect(res.body[0].lastFourDigits).toBe("4242");
		});
	});

	describe("Operations on a specific payment method", () => {
		let testPm;
		beforeEach(async () => {
			testPm = await PaymentMethod.create({
				...paymentMethodData,
				userId: buyerUser._id,
				isDefault: false,
			});
		});

		it("GET /api/v1/me/payment-methods/:paymentMethodId - should get details", async () => {
			const res = await request
				.get(`/api/v1/me/payment-methods/${testPm._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.paymentGatewayToken).toBe(testPm.paymentGatewayToken);
		});

		it("PATCH /api/v1/me/payment-methods/:paymentMethodId - should update (set as default)", async () => {
			// Create another to ensure only one default
			await PaymentMethod.create({
				...paymentMethodData,
				paymentToken: `pm_other_${uuidv4()}`,
				userId: buyerUser._id,
				isDefault: true,
			});

			const res = await request
				.patch(`/api/v1/me/payment-methods/${testPm._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ isDefault: true })
				.expect(200);
			expect(res.body.isDefault).toBe(true);

			const otherPm = await PaymentMethod.findOne({
				paymentGatewayToken: `pm_other_${uuidv4()}`,
			});
			expect(otherPm.isDefault).toBe(false);
		});

		it("DELETE /api/v1/me/payment-methods/:paymentMethodId - should delete", async () => {
			await request
				.delete(`/api/v1/me/payment-methods/${testPm._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(204);
			const dbPm = await PaymentMethod.findById(testPm._id);
			expect(dbPm).toBeNull();
		});
	});
});
