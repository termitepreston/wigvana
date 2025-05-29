import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Product from "../../src/models/Product.model.js";
import Review from "../../src/models/Review.model.js";
import Order from "../../src/models/Order.model.js";
import OrderItem from "../../src/models/OrderItem.model.js";
import Category from "../../src/models/Category.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Buyer Review Endpoints", () => {
	let buyerUser;
	let buyerToken;
	let product1;
	let product2; // product2 for listing reviews by product
	let orderForProduct1;

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
		await Review.deleteMany({});
		await Order.deleteMany({});
		await OrderItem.deleteMany({});
		await Category.deleteMany({});
		await redisService.client.flushdb();

		const rawPassword = "reviewUserPass";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		buyerUser = await User.create({
			firstName: "Reviewer",
			lastName: "Buyer",
			email: `review-${uuidv4()}@example.com`,
			passwordHash: hashedPassword,
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		buyerToken = await loginUserAndGetToken(buyerUser.email, rawPassword);

		const category = await Category.create({
			name: "Review Category",
			slug: `review-cat-${uuidv4()}`,
		});
		const seller = await User.create({
			firstName: "ReviewSeller",
			lastName: "Test",
			email: `revseller-${uuidv4()}@example.com`,
			passwordHash: "test",
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});

		product1 = await Product.create({
			name: "Product To Review",
			slug: `prod-review-${uuidv4()}`,
			description: "For reviewing",
			basePrice: 20,
			currency: "USD",
			categoryId: category._id,
			sellerId: seller._id,
			isPublished: true,
			approvalStatus: "approved",
		});
		product2 = await Product.create({
			// Another product for filter tests
			name: "Another Product",
			slug: `prod-another-${uuidv4()}`,
			description: "Another for reviewing",
			basePrice: 30,
			currency: "USD",
			categoryId: category._id,
			sellerId: seller._id,
			isPublished: true,
			approvalStatus: "approved",
		});

		// Simulate a completed purchase for product1 by buyerUser
		orderForProduct1 = await Order.create({
			userId: buyerUser._id,
			status: "delivered",
			totalAmount: 20,
			currency: "USD",
			shippingAddressSnapshot: {},
			billingAddressSnapshot: {},
			paymentMethodDetailsSnapshot: {},
		});
		await OrderItem.create({
			orderId: orderForProduct1._id,
			productId: product1._id,
			sellerId: seller._id,
			productNameSnapshot: "p",
			variantAttributesSnapshot: {},
			quantity: 1,
			unitPrice: 20,
			totalPrice: 20,
		});
	});

	const reviewData = {
		rating: 5,
		title: "Great!",
		comment: "Loved this product.",
	};

	describe("POST /api/v1/products/:productId/reviews", () => {
		it("should allow a buyer to write a review for a purchased product", async () => {
			const res = await request
				.post(`/api/v1/products/${product1._id}/reviews`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send(reviewData)
				.expect(201);

			expect(res.body.rating).toBe(reviewData.rating);
			expect(res.body.userId).toBe(buyerUser._id.toString());
			expect(res.body.productId).toBe(product1._id.toString());

			const dbReview = await Review.findById(res.body.id);
			expect(dbReview).not.toBeNull();
			const updatedProduct = await Product.findById(product1._id);
			expect(updatedProduct.averageRating).toBe(5);
			expect(updatedProduct.reviewCount).toBe(1);
		});

		it("should return 403 if buyer did not purchase the product", async () => {
			await request
				.post(`/api/v1/products/${product2._id}/reviews`) // product2 not "purchased" in this setup
				.set("Authorization", `Bearer ${buyerToken}`)
				.send(reviewData)
				.expect(403);
		});

		it("should return 409 if buyer already reviewed the product", async () => {
			await Review.create({
				...reviewData,
				userId: buyerUser._id,
				productId: product1._id,
				orderId: orderForProduct1._id,
			});
			await request
				.post(`/api/v1/products/${product1._id}/reviews`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send(reviewData)
				.expect(409);
		});
	});

	describe("GET /api/v1/me/reviews", () => {
		beforeEach(async () => {
			// Create some reviews by the buyer for product1 and product2 (assuming product2 was also purchased for this test)
			const orderForProduct2 = await Order.create({
				userId: buyerUser._id,
				status: "delivered",
				totalAmount: 30,
				currency: "USD",
				shippingAddressSnapshot: {},
				billingAddressSnapshot: {},
				paymentMethodDetailsSnapshot: {},
			});
			await OrderItem.create({
				orderId: orderForProduct2._id,
				productId: product2._id,
				sellerId: product2.sellerId,
				productNameSnapshot: "p2",
				variantAttributesSnapshot: {},
				quantity: 1,
				unitPrice: 30,
				totalPrice: 30,
			});

			await Review.create({
				...reviewData,
				rating: 5,
				userId: buyerUser._id,
				productId: product1._id,
				orderId: orderForProduct1._id,
			});
			await Review.create({
				...reviewData,
				rating: 4,
				userId: buyerUser._id,
				productId: product2._id,
				orderId: orderForProduct2._id,
			});
		});

		it("should list all reviews by the buyer", async () => {
			const res = await request
				.get("/api/v1/me/reviews")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(2);
		});

		it("should filter buyer's reviews by productId", async () => {
			const res = await request
				.get(`/api/v1/me/reviews?productId=${product1._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].productId.id.toString()).toBe(
				product1._id.toString(),
			); // Assuming productId is populated
		});

		it("should filter buyer's reviews by rating", async () => {
			const res = await request
				.get("/api/v1/me/reviews?rating=4")
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].rating).toBe(4);
		});
	});

	describe("PATCH /api/v1/me/reviews/:reviewId", () => {
		let testReview;
		beforeEach(async () => {
			testReview = await Review.create({
				...reviewData,
				userId: buyerUser._id,
				productId: product1._id,
				orderId: orderForProduct1._id,
			});
		});

		it("should update buyer's own review", async () => {
			const updatePayload = { rating: 3, comment: "It was okay." };
			const res = await request
				.patch(`/api/v1/me/reviews/${testReview._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send(updatePayload)
				.expect(200);
			expect(res.body.rating).toBe(3);
			expect(res.body.comment).toBe("It was okay.");
			const updatedProduct = await Product.findById(product1._id);
			expect(updatedProduct.averageRating).toBe(3); // Assuming only one review now
		});

		it("should return 404 if review not found or not owned by buyer", async () => {
			await request
				.patch(`/api/v1/me/reviews/${uuidv4()}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.send({ rating: 2 })
				.expect(404);
		});
	});

	describe("DELETE /api/v1/me/reviews/:reviewId", () => {
		let testReview;
		beforeEach(async () => {
			testReview = await Review.create({
				...reviewData,
				userId: buyerUser._id,
				productId: product1._id,
				orderId: orderForProduct1._id,
			});
			await Product.findByIdAndUpdate(product1._id, {
				averageRating: 5,
				reviewCount: 1,
			}); // Simulate product updated
		});

		it("should delete buyer's own review", async () => {
			await request
				.delete(`/api/v1/me/reviews/${testReview._id}`)
				.set("Authorization", `Bearer ${buyerToken}`)
				.expect(204);
			const dbReview = await Review.findById(testReview._id);
			expect(dbReview).toBeNull();
			const updatedProduct = await Product.findById(product1._id);
			expect(updatedProduct.reviewCount).toBe(0); // Should be recalculated
			expect(updatedProduct.averageRating).toBe(0);
		});
	});
});
