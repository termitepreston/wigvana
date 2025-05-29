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
import Address from "../../src/models/Address.model.js";
import PaymentMethod from "../../src/models/PaymentMethod.model.js";
import Order from "../../src/models/Order.model.js";
import OrderItem from "../../src/models/OrderItem.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Seller Order Management Endpoints (/me/store/orders)", () => {
	let sellerUser;
	let sellerToken;
	let buyerUser;
	let buyerToken;
	let product1BySeller;
	let product2BySeller;
	let productByOtherSeller;
	let order1;
	let order2; // order1 has product1, order2 has product2 & productByOtherSeller

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
		await Order.deleteMany({});
		await OrderItem.deleteMany({});
		await redisService.client.flushdb();

		const sellerPassword = "sellerOrderPass";
		const buyerPassword = "buyerOrderPass";
		sellerUser = await User.create({
			firstName: "OrderSeller",
			lastName: "Manages",
			email: `orderseller-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash(sellerPassword, 10),
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});
		buyerUser = await User.create({
			firstName: "OrderBuyer",
			lastName: "Buys",
			email: `orderbuyer-${uuidv4()}@example.com`,
			passwordHash: await bcrypt.hash(buyerPassword, 10),
			roles: ["buyer"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerToken = await loginUserAndGetToken(sellerUser.email, sellerPassword);
		// buyerToken not directly used by seller endpoints but useful for creating orders

		const category = await Category.create({
			name: "Seller Order Category",
			slug: `so-cat-${uuidv4()}`,
		});
		const otherSeller = await User.create({
			firstName: "OtherS",
			lastName: "L",
			email: `others-${uuidv4()}@example.com`,
			passwordHash: "p",
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});

		product1BySeller = await Product.create({
			name: "P1 Seller",
			slug: `p1s-${uuidv4()}`,
			categoryId: category._id,
			sellerId: sellerUser._id,
			basePrice: 10,
			currency: "USD",
			isPublished: true,
			approvalStatus: "approved",
		});
		product2BySeller = await Product.create({
			name: "P2 Seller",
			slug: `p2s-${uuidv4()}`,
			categoryId: category._id,
			sellerId: sellerUser._id,
			basePrice: 20,
			currency: "USD",
			isPublished: true,
			approvalStatus: "approved",
		});
		productByOtherSeller = await Product.create({
			name: "P Other",
			slug: `pos-${uuidv4()}`,
			categoryId: category._id,
			sellerId: otherSeller._id,
			basePrice: 30,
			currency: "USD",
			isPublished: true,
			approvalStatus: "approved",
		});

		// Create some orders
		order1 = await Order.create({
			userId: buyerUser._id,
			status: "processing",
			totalAmount: 10,
			currency: "USD",
			shippingAddressSnapshot: {},
			billingAddressSnapshot: {},
			paymentMethodDetailsSnapshot: {},
		});
		await OrderItem.create({
			orderId: order1._id,
			productId: product1BySeller._id,
			sellerId: sellerUser._id,
			quantity: 1,
			unitPrice: 10,
			totalPrice: 10,
			productNameSnapshot: "p1s",
			variantAttributesSnapshot: {},
		});

		order2 = await Order.create({
			userId: buyerUser._id,
			status: "shipped",
			totalAmount: 50,
			currency: "USD",
			shippingAddressSnapshot: {},
			billingAddressSnapshot: {},
			paymentMethodDetailsSnapshot: {},
		});
		await OrderItem.create({
			orderId: order2._id,
			productId: product2BySeller._id,
			sellerId: sellerUser._id,
			quantity: 1,
			unitPrice: 20,
			totalPrice: 20,
			productNameSnapshot: "p2s",
			variantAttributesSnapshot: {},
		});
		await OrderItem.create({
			orderId: order2._id,
			productId: productByOtherSeller._id,
			sellerId: otherSeller._id,
			quantity: 1,
			unitPrice: 30,
			totalPrice: 30,
			productNameSnapshot: "pos",
			variantAttributesSnapshot: {},
		}); // Item from another seller
	});

	describe("GET /api/v1/me/store/orders", () => {
		it("should list orders containing items sold by the seller", async () => {
			const res = await request
				.get("/api/v1/me/store/orders")
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(2); // Both order1 and order2 contain items from sellerUser
			// Ensure the orders returned indeed have items from this seller
			const orderIdsFromResponse = res.body.results.map((o) => o.id);
			expect(orderIdsFromResponse).toContain(order1._id.toString());
			expect(orderIdsFromResponse).toContain(order2._id.toString());
		});

		it("should filter seller orders by status", async () => {
			const res = await request
				.get("/api/v1/me/store/orders?status=shipped")
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].id).toBe(order2._id.toString());
		});
	});

	describe("GET /api/v1/me/store/orders/:orderId", () => {
		it("should get details of an order containing seller's items", async () => {
			const res = await request
				.get(`/api/v1/me/store/orders/${order2._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.id).toBe(order2._id.toString());
			expect(res.body.items.length).toBe(2); // Shows all items in the order
		});

		it("should return 404 if order has no items from this seller", async () => {
			const buyerOrderOnlyWithOtherSeller = await Order.create({
				userId: buyerUser._id,
				status: "processing",
				totalAmount: 30,
				currency: "USD",
				shippingAddressSnapshot: {},
				billingAddressSnapshot: {},
				paymentMethodDetailsSnapshot: {},
			});
			await OrderItem.create({
				orderId: buyerOrderOnlyWithOtherSeller._id,
				productId: productByOtherSeller._id,
				sellerId: productByOtherSeller.sellerId,
				quantity: 1,
				unitPrice: 30,
				totalPrice: 30,
				productNameSnapshot: "p",
				variantAttributesSnapshot: {},
			});

			await request
				.get(`/api/v1/me/store/orders/${buyerOrderOnlyWithOtherSeller._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(404);
		});
	});

	describe("PATCH /api/v1/me/store/orders/:orderId/status", () => {
		it('should allow seller to update order status to "shipped" with tracking', async () => {
			const statusData = {
				status: "shipped",
				trackingNumber: "TRACK123XYZ",
				carrier: "FedEx",
			};
			const res = await request
				.patch(`/api/v1/me/store/orders/${order1._id}/status`) // order1 is 'processing'
				.set("Authorization", `Bearer ${sellerToken}`)
				.send(statusData)
				.expect(200);
			expect(res.body.status).toBe("shipped");
			expect(res.body.trackingNumber).toBe("TRACK123XYZ");

			const dbOrder = await Order.findById(order1._id);
			expect(dbOrder.status).toBe("shipped");
		});

		it('should require tracking number if status is "shipped"', async () => {
			await request
				.patch(`/api/v1/me/store/orders/${order1._id}/status`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ status: "shipped" }) // Missing trackingNumber
				.expect(400);
		});

		it("should return 403 if seller tries to update status of an order not containing their items", async () => {
			const orderWithOnlyOtherSellerItems = await Order.create({
				userId: buyerUser._id,
				status: "processing",
				totalAmount: 1,
				currency: "USD",
				shippingAddressSnapshot: {},
				billingAddressSnapshot: {},
				paymentMethodDetailsSnapshot: {},
			});
			await OrderItem.create({
				orderId: orderWithOnlyOtherSellerItems._id,
				productId: productByOtherSeller._id,
				sellerId: productByOtherSeller.sellerId,
				quantity: 1,
				unitPrice: 1,
				totalPrice: 1,
				productNameSnapshot: "p",
				variantAttributesSnapshot: {},
			});
			await request
				.patch(
					`/api/v1/me/store/orders/${orderWithOnlyOtherSellerItems._id}/status`,
				)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ status: "processing" })
				.expect(403);
		});
	});

	// Seller Return Management Tests (Placeholders - requires ReturnRequest model)
	describe("Seller Return Management (Placeholder)", () => {
		it.skip("GET /me/store/returns - should list return requests (TODO: Implement ReturnRequest model)", async () => {
			// Setup: Create ReturnRequest documents linked to sellerUser
			const res = await request
				.get("/api/v1/me/store/returns")
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			// expect(res.body.results).toBeInstanceOf(Array);
		});

		it.skip("PATCH /me/store/returns/:returnId/status - should update return request status (TODO: Implement)", async () => {
			// const mockReturnId = uuidv4(); // ID of a ReturnRequest owned by sellerUser
			// const res = await request.patch(`/api/v1/me/store/returns/${mockReturnId}/status`)
			//     .set('Authorization', `Bearer ${sellerToken}`)
			//     .send({ status: 'approved' })
			//     .expect(200);
			// expect(res.body.status).toBe('approved');
		});
	});
});
