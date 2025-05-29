import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Product from "../../src/models/Product.model.js";
import Order from "../../src/models/Order.model.js";
import OrderItem from "../../src/models/OrderItem.model.js";
import Conversation from "../../src/models/Conversation.model.js";
import ChatMessage from "../../src/models/ChatMessage.model.js";
import Category from "../../src/models/Category.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Buyer Initiate Conversation Endpoint (POST /api/v1/conversations)", () => {
	let buyerUser;
	let sellerUser;
	let buyerToken;
	let sellerToken;
	let product1;
	let order1;

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
		await Order.deleteMany({});
		await OrderItem.deleteMany({});
		await Conversation.deleteMany({});
		await ChatMessage.deleteMany({});
		await Category.deleteMany({});
		await redisService.client.flushdb();

		const buyerPassword = "buyerPassConvo";
		const sellerPassword = "sellerPassConvo";
		const hashedBuyerPass = await bcrypt.hash(buyerPassword, 10);
		const hashedSellerPass = await bcrypt.hash(sellerPassword, 10);

		buyerUser = await User.create({
			firstName: "ConvoBuyer",
			lastName: "Init",
			email: `convobuyer-${uuidv4()}@example.com`,
			passwordHash: hashedBuyerPass,
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerUser = await User.create({
			firstName: "ConvoSeller",
			lastName: "Resp",
			email: `convoseller-${uuidv4()}@example.com`,
			passwordHash: hashedSellerPass,
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});

		buyerToken = await loginUserAndGetToken(buyerUser.email, buyerPassword);
		// sellerToken not needed for buyer initiating tests, but good to have for symmetry

		const category = await Category.create({
			name: "Convo Category",
			slug: `convo-cat-${uuidv4()}`,
		});
		product1 = await Product.create({
			name: "Convo Product",
			slug: `convo-prod-${uuidv4()}`,
			description: "For conversation testing",
			basePrice: 50,
			currency: "USD",
			categoryId: category._id,
			sellerId: sellerUser._id,
			isPublished: true,
			approvalStatus: "approved",
		});

		order1 = await Order.create({
			userId: buyerUser._id,
			status: "delivered",
			totalAmount: 50,
			currency: "USD",
			shippingAddressSnapshot: {},
			billingAddressSnapshot: {},
			paymentMethodDetailsSnapshot: {},
		});
		await OrderItem.create({
			orderId: order1._id,
			productId: product1._id,
			sellerId: sellerUser._id,
			productNameSnapshot: "cp",
			variantAttributesSnapshot: {},
			quantity: 1,
			unitPrice: 50,
			totalPrice: 50,
		});
	});

	const initialMessage = { initialMessageText: "Hello, I have a question." };

	it("should initiate a new conversation related to a product", async () => {
		const res = await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, productId: product1._id })
			.expect(200); // Or 201 if service distinguishes new conversation creation

		expect(res.body.id).toBeDefined();
		expect(res.body.otherParticipant.userId).toBe(sellerUser._id.toString());
		expect(res.body.productContext.id).toBe(product1._id.toString());
		expect(res.body.lastMessageSnippet).toBe(initialMessage.initialMessageText);

		const dbConvo = await Conversation.findById(res.body.id);
		expect(dbConvo).not.toBeNull();
		expect(dbConvo.productId.toString()).toBe(product1._id.toString());
		const dbMessages = await ChatMessage.find({ conversationId: dbConvo._id });
		expect(dbMessages.length).toBe(1);
		expect(dbMessages[0].messageText).toBe(initialMessage.initialMessageText);
	});

	it("should initiate a new conversation related to an order", async () => {
		const res = await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, orderId: order1._id })
			.expect(200);

		expect(res.body.otherParticipant.userId).toBe(sellerUser._id.toString()); // Seller from order item
		expect(res.body.orderContext).toBeDefined(); // If service populates this
		expect(res.body.lastMessageSnippet).toBe(initialMessage.initialMessageText);
	});

	it("should initiate a new general conversation with a seller", async () => {
		const res = await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, sellerUserId: sellerUser._id })
			.expect(200);

		expect(res.body.otherParticipant.userId).toBe(sellerUser._id.toString());
		expect(res.body.productContext).toBeNull();
		expect(res.body.orderContext).toBeNull();
	});

	it("should return an existing conversation if one matches context and add message", async () => {
		// First, create a conversation
		await Conversation.create({
			buyerId: buyerUser._id,
			sellerId: sellerUser._id,
			productId: product1._id,
		});

		const res = await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, productId: product1._id }) // Same context
			.expect(200);

		const dbMessages = await ChatMessage.find({ conversationId: res.body.id });
		expect(dbMessages.length).toBe(1); // Only one new message added
	});

	it("should return 400 if no context (productId, orderId, or sellerUserId) is provided", async () => {
		await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ initialMessageText: "No context here." })
			.expect(400);
	});

	it("should return 400 if multiple contexts are provided", async () => {
		await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, productId: product1._id, orderId: order1._id })
			.expect(400);
	});

	it("should return 404 if product context not found", async () => {
		await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, productId: uuidv4() })
			.expect(404);
	});

	it("should return 400 if buyer tries to message themselves as seller", async () => {
		await request
			.post("/api/v1/conversations")
			.set("Authorization", `Bearer ${buyerToken}`)
			.send({ ...initialMessage, sellerUserId: buyerUser._id })
			.expect(400);
	});
});
