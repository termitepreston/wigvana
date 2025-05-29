import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Cart from "../../src/models/Cart.model.js";
import CartItem from "../../src/models/CartItem.model.js";
import Product from "../../src/models/Product.model.js";
import ProductVariant from "../../src/models/ProductVariant.model.js";
import Category from "../../src/models/Category.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

// Helper to login a user and get token
const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Buyer Cart Endpoints (/me/cart)", () => {
	let buyerUser;
	let buyerToken;
	let product1;
	let variant1_1;
	let variant1_2;
	let anonymousCartId; // For merge test

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
		await Cart.deleteMany({});
		await CartItem.deleteMany({});
		await Product.deleteMany({});
		await ProductVariant.deleteMany({});
		await Category.deleteMany({});
		await redisService.client.flushdb();

		const rawPassword = "passwordBuyer123";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		buyerUser = await User.create({
			firstName: "Buyer",
			lastName: "User",
			email: `buyer-${uuidv4()}@example.com`,
			passwordHash: hashedPassword,
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		buyerToken = await loginUserAndGetToken(buyerUser.email, rawPassword);

		const category = await Category.create({
			name: "Cart Category",
			slug: `cart-cat-${uuidv4()}`,
		});
		const seller = await User.create({
			firstName: "Seller",
			lastName: "ForCart",
			email: `seller-cart-${uuidv4()}@example.com`,
			passwordHash: "test",
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});

		product1 = await Product.create({
			name: "BuyerCart Product",
			slug: `buyercart-prod-${uuidv4()}`,
			description: "For buyer cart",
			basePrice: 50,
			currency: "USD",
			categoryId: category._id,
			sellerId: seller._id,
			isPublished: true,
			approvalStatus: "approved",
		});
		variant1_1 = await ProductVariant.create({
			productId: product1._id,
			sku: `BCP-V1-${uuidv4()}`,
			attributes: { color: "Red" },
			price: 50,
			stockQuantity: 20,
			isActive: true,
		});
		variant1_2 = await ProductVariant.create({
			productId: product1._id,
			sku: `BCP-V2-${uuidv4()}`,
			attributes: { color: "Blue" },
			price: 55,
			stockQuantity: 15,
			isActive: true,
		});

		// Create an anonymous cart for merge test
		const anonCartRes = await request.post("/api/v1/carts").send({
			productId: product1._id,
			variantId: variant1_1._id,
			quantity: 1,
		});
		anonymousCartId = anonCartRes.body.id;
	});

	describe("GET /api/v1/me/cart", () => {
		it("should get an empty cart for a new buyer", async () => {
			const res = await request
				.get("/api/v1/me/cart")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.items.length).toBe(0);
			expect(res.body.userId).toBe(buyerUser._id.toString());
		});
	});

	describe("POST /api/v1/me/cart/items", () => {
		it("should add an item to the buyer cart", async () => {
			const res = await request
				.post("/api/v1/me/cart/items")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({
					productId: product1._id,
					variantId: variant1_1._id,
					quantity: 2,
				})
				.expect(200);

			expect(res.body.items.length).toBe(1);
			expect(res.body.items[0].variantId).toBe(variant1_1._id.toString());
			expect(res.body.items[0].quantity).toBe(2);
		});
	});

	describe("Cart operations on existing cart", () => {
		let cartItemId;
		beforeEach(async () => {
			// Add an item to cart first
			const addRes = await request
				.post("/api/v1/me/cart/items")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({
					productId: product1._id,
					variantId: variant1_1._id,
					quantity: 1,
				});
			cartItemId = addRes.body.items[0].id;
		});

		it("PUT /api/v1/me/cart/items/:itemId - should update item quantity", async () => {
			const res = await request
				.put(`/api/v1/me/cart/items/${cartItemId}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ quantity: 5 })
				.expect(200);
			expect(res.body.items[0].quantity).toBe(5);
		});

		it("DELETE /api/v1/me/cart/items/:itemId - should remove an item", async () => {
			await request
				.delete(`/api/v1/me/cart/items/${cartItemId}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);

			const cartRes = await request
				.get("/api/v1/me/cart")
				.set("Authorization", `Bearer ${buyerToken}`);
			expect(cartRes.body.items.length).toBe(0);
		});

		it("DELETE /api/v1/me/cart - should clear the cart", async () => {
			// Add another item
			await request
				.post("/api/v1/me/cart/items")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({
					productId: product1._id,
					variantId: variant1_2._id,
					quantity: 1,
				});

			await request
				.delete("/api/v1/me/cart")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);

			const cartRes = await request
				.get("/api/v1/me/cart")
				.set("Authorization", `Bearer ${buyerToken}`);
			expect(cartRes.body.items.length).toBe(0);
		});
	});

	describe("POST /api/v1/me/cart/merge-anonymous", () => {
		it("should merge an anonymous cart into the buyer cart", async () => {
			// Buyer cart is initially empty for this test case within the describe block
			// Anonymous cart has 1 item (variant1_1, qty 1)

			const res = await request
				.post("/api/v1/me/cart/merge-anonymous")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ anonymousCartId })
				.expect(200);

			expect(res.body.items.length).toBe(1);
			expect(res.body.items[0].variantId).toBe(variant1_1._id.toString());
			expect(res.body.items[0].quantity).toBe(1);

			const anonCartDb = await Cart.findOne({
				anonymousCartToken: anonymousCartId,
			});
			expect(anonCartDb.status).toBe("merged");
		});

		it("should merge and sum quantities if item exists in both carts", async () => {
			// Add variant1_1 to buyer's cart first
			await request
				.post("/api/v1/me/cart/items")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({
					productId: product1._id,
					variantId: variant1_1._id,
					quantity: 2,
				});
			// Anonymous cart has variant1_1 with quantity 1

			const res = await request
				.post("/api/v1/me/cart/merge-anonymous")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ anonymousCartId })
				.expect(200);

			expect(res.body.items.length).toBe(1);
			expect(res.body.items[0].variantId).toBe(variant1_1._id.toString());
			expect(res.body.items[0].quantity).toBe(3); // 2 (buyer) + 1 (anon)
		});

		it("should return 404 if anonymous cart ID is invalid", async () => {
			await request
				.post("/api/v1/me/cart/merge-anonymous")
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ anonymousCartId: uuidv4() })
				.expect(404); // Because getOrCreateAnonymousCart in service throws if token invalid
		});
	});
});
