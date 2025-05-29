import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Product from "../../src/models/Product.model.js";
import ProductVariant from "../../src/models/ProductVariant.model.js";
import Category from "../../src/models/Category.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Seller Product Variant Management Endpoints (/me/products/:productId/variants)", () => {
	let sellerUser;
	let sellerToken;
	let category1;
	let product1;

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
		await Product.deleteMany({});
		await ProductVariant.deleteMany({});
		await Category.deleteMany({});
		await redisService.client.flushdb();

		const rawPassword = "sellerVariantPass";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		sellerUser = await User.create({
			firstName: "VariantSeller",
			lastName: "Owner",
			email: `variantseller-${uuidv4()}@example.com`,
			passwordHash: hashedPassword,
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerToken = await loginUserAndGetToken(sellerUser.email, rawPassword);

		category1 = await Category.create({
			name: "Variant Category",
			slug: `variant-cat-${uuidv4()}`,
			isActive: true,
		});
		product1 = await Product.create({
			name: "Product With Variants",
			slug: `prod-variants-${uuidv4()}`,
			description: "Base product",
			categoryId: category1._id,
			sellerId: sellerUser._id,
			basePrice: 100,
			currency: "USD",
			isPublished: true,
			approvalStatus: "approved",
		});
	});

	const variantData = {
		sku: `SKU-${uuidv4()}`,
		attributes: { color: "Red", size: "M" },
		price: 110.0,
		stockQuantity: 50,
	};

	describe("POST /me/products/:productId/variants", () => {
		it("should add a new variant to the seller's product", async () => {
			const res = await request
				.post(`/api/v1/me/products/${product1._id}/variants`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(variantData)
				.expect(201);

			expect(res.body.sku).toBe(variantData.sku);
			expect(res.body.productId.toString()).toBe(product1._id.toString());
			expect(res.body.attributes.color).toBe("Red");
			const dbVariant = await ProductVariant.findById(res.body.id);
			expect(dbVariant).not.toBeNull();
		});

		it("should return 409 if SKU already exists", async () => {
			await ProductVariant.create({ ...variantData, productId: product1._id }); // Create first
			await request
				.post(`/api/v1/me/products/${product1._id}/variants`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(variantData) // Try to create with same SKU
				.expect(409);
		});

		it("should return 404 if product not found or not owned by seller", async () => {
			await request
				.post(`/api/v1/me/products/${uuidv4()}/variants`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(variantData)
				.expect(404);
		});
	});

	describe("GET /me/products/:productId/variants", () => {
		beforeEach(async () => {
			await ProductVariant.create({
				...variantData,
				productId: product1._id,
				sku: `SKU1-${uuidv4()}`,
			});
			await ProductVariant.create({
				...variantData,
				productId: product1._id,
				sku: `SKU2-${uuidv4()}`,
				attributes: { color: "Blue", size: "L" },
			});
		});

		it("should list variants for the seller's product", async () => {
			const res = await request
				.get(`/api/v1/me/products/${product1._id}/variants`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.length).toBe(2);
		});
	});

	describe("Operations on a specific product variant", () => {
		let testVariant;
		beforeEach(async () => {
			testVariant = await ProductVariant.create({
				...variantData,
				productId: product1._id,
			});
		});

		it("GET /me/products/:productId/variants/:variantId - should get variant details", async () => {
			const res = await request
				.get(`/api/v1/me/products/${product1._id}/variants/${testVariant._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.sku).toBe(testVariant.sku);
		});

		it("PUT /me/products/:productId/variants/:variantId - should update a variant", async () => {
			const updatedPrice = 125.5;
			const newSku = `UPDATED-SKU-${uuidv4()}`;
			const updatedData = {
				...variantData, // Keep other fields same as original for PUT
				sku: newSku,
				price: updatedPrice,
				stockQuantity: 40,
			};
			const res = await request
				.put(`/api/v1/me/products/${product1._id}/variants/${testVariant._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(updatedData)
				.expect(200);
			expect(res.body.price).toBe(updatedPrice);
			expect(res.body.sku).toBe(newSku);
		});

		it("PATCH /me/products/:productId/variants/:variantId - should partially update a variant (e.g., stock)", async () => {
			const newStock = 30;
			const res = await request
				.patch(
					`/api/v1/me/products/${product1._id}/variants/${testVariant._id}`,
				)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ stockQuantity: newStock })
				.expect(200);
			expect(res.body.stockQuantity).toBe(newStock);
		});

		it("DELETE /me/products/:productId/variants/:variantId - should delete a variant", async () => {
			await request
				.delete(
					`/api/v1/me/products/${product1._id}/variants/${testVariant._id}`,
				)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(204);
			const dbVariant = await ProductVariant.findById(testVariant._id);
			expect(dbVariant).toBeNull();
		});
	});
});
