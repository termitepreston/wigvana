import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Product from "../../src/models/Product.model.js";
import Review from "../../src/models/Review.model.js";
import ReviewResponse from "../../src/models/ReviewResponse.model.js";
import Category from "../../src/models/Category.model.js";
import Order from "../../src/models/Order.model.js"; // For creating order context
import OrderItem from "../../src/models/OrderItem.model.js"; // For creating order context
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Seller Review Interaction Endpoint (/me/reviews/:reviewId/respond)", () => {
	let sellerUser;
	let sellerToken;
	let buyerUser;
	let buyerToken;
	let productBySeller;
	let reviewOnProduct;

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
		await ReviewResponse.deleteMany({});
		await Category.deleteMany({});
		await Order.deleteMany({});
		await OrderItem.deleteMany({});
		await redisService.client.flushdb();

		const sellerPassword = "sellerReviewPass";
		const buyerPassword = "buyerReviewPass";
		sellerUser = await User.create({
			firstName: "ReviewSeller",
			lastName: "Responder",
			email: `revseller-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash(sellerPassword, 10),
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});
		buyerUser = await User.create({
			firstName: "ReviewBuyer",
			lastName: "Writer",
			email: `revbuyer-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash(buyerPassword, 10),
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerToken = await loginUserAndGetToken(sellerUser.email, sellerPassword);
		// buyerToken not used by seller endpoint directly, but needed for buyer to create review

		const category = await Category.create({
			name: "Seller Review Category",
			slug: `sr-cat-${uuidv4()}`,
		});
		productBySeller = await Product.create({
			name: "Product For Seller Response",
			slug: `pfsr-${uuidv4()}`,
			categoryId: category._id,
			sellerId: sellerUser._id,
			basePrice: 50,
			currency: "USD",
			isPublished: true,
			approvalStatus: "approved",
		});

		// Buyer creates a review on seller's product
		// Simulate purchase for review creation policy
		const order = await Order.create({
			userId: buyerUser._id,
			status: "delivered",
			totalAmount: 50,
			currency: "USD",
			shippingAddressSnapshot: {},
			billingAddressSnapshot: {},
			paymentMethodDetailsSnapshot: {},
		});
		await OrderItem.create({
			orderId: order._id,
			productId: productBySeller._id,
			sellerId: sellerUser._id,
			quantity: 1,
			unitPrice: 50,
			totalPrice: 50,
			productNameSnapshot: "p",
			variantAttributesSnapshot: {},
		});

		reviewOnProduct = await Review.create({
			productId: productBySeller._id,
			userId: buyerUser._id,
			orderId: order._id,
			rating: 4,
			comment: "This product is quite good.",
			isApproved: true,
		});
	});

	const responseData = {
		responseText: "Thank you for your valuable feedback!",
	};

	describe("POST /api/v1/me/reviews/:reviewId/respond", () => {
		it("should allow a seller to respond to a review on their product", async () => {
			const res = await request
				.post(`/api/v1/me/reviews/${reviewOnProduct._id}/respond`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(responseData)
				.expect(201);

			expect(res.body.responseText).toBe(responseData.responseText);
			expect(res.body.sellerId.toString()).toBe(sellerUser._id.toString());
			expect(res.body.reviewId.toString()).toBe(reviewOnProduct._id.toString());

			const dbResponse = await ReviewResponse.findById(res.body.id);
			expect(dbResponse).not.toBeNull();
			const updatedReview = await Review.findById(reviewOnProduct._id);
			expect(updatedReview.sellerResponseId.toString()).toBe(
				dbResponse._id.toString(),
			);
		});

		it("should return 403 if seller tries to respond to a review not on their product", async () => {
			const otherSeller = await User.create({
				firstName: "Other",
				lastName: "S",
				email: `os-${uuidv4()}@example.com`,
				passwordHash: "p",
				roles: ["seller"],
				emailVerified: true,
				accountStatus: "active",
			});
			const productByOther = await Product.create({
				name: "Other P",
				slug: `op-${uuidv4()}`,
				categoryId: category1._id,
				sellerId: otherSeller._id,
				basePrice: 1,
				currency: "USD",
				isPublished: true,
				approvalStatus: "approved",
			});
			const orderOther = await Order.create({
				userId: buyerUser._id,
				status: "delivered",
				totalAmount: 1,
				currency: "USD",
				shippingAddressSnapshot: {},
				billingAddressSnapshot: {},
				paymentMethodDetailsSnapshot: {},
			});
			await OrderItem.create({
				orderId: orderOther._id,
				productId: productByOther._id,
				sellerId: otherSeller._id,
				quantity: 1,
				unitPrice: 1,
				totalPrice: 1,
				productNameSnapshot: "p",
				variantAttributesSnapshot: {},
			});
			const reviewOnOtherProduct = await Review.create({
				productId: productByOther._id,
				userId: buyerUser._id,
				orderId: orderOther._id,
				rating: 5,
				comment: "Good",
				isApproved: true,
			});

			await request
				.post(`/api/v1/me/reviews/${reviewOnOtherProduct._id}/respond`)
				.set("Authorization", `Bearer ${sellerToken}`) // sellerUser token
				.send(responseData)
				.expect(403);
		});

		it("should return 409 if seller has already responded to the review", async () => {
			await ReviewResponse.create({
				reviewId: reviewOnProduct._id,
				sellerId: sellerUser._id,
				responseText: "Initial response.",
			});
			// Manually update the review's sellerResponseId for the test's sake, as hooks might not run in direct create
			const linkedReview = await Review.findById(reviewOnProduct._id);
			const existingResponse = await ReviewResponse.findOne({
				reviewId: reviewOnProduct._id,
			});
			linkedReview.sellerResponseId = existingResponse._id;
			await linkedReview.save();

			await request
				.post(`/api/v1/me/reviews/${reviewOnProduct._id}/respond`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(responseData)
				.expect(409);
		});

		it("should return 404 if review does not exist", async () => {
			await request
				.post(`/api/v1/me/reviews/${uuidv4()}/respond`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(responseData)
				.expect(404);
		});
	});
});
