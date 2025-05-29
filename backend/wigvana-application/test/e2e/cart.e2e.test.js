import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import app from "../../src/app.js";
import Cart from "../../src/models/Cart.model.js";
import CartItem from "../../src/models/CartItem.model.js";
import Product from "../../src/models/Product.model.js";
import ProductVariant from "../../src/models/ProductVariant.model.js";
import Category from "../../src/models/Category.model.js";
import User from "../../src/models/User.model.js";

const request = supertest(app);

describe("Anonymous Cart Endpoints", () => {
	let categoryId;
	let sellerId;
	let product1;
	let variant1_1;
	let variant1_2;

	beforeAll(async () => {
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(global.testConfig.MONGO_URI, {
				directConnection: true,
			});
		}
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await Cart.deleteMany({});
		await CartItem.deleteMany({});
		await Product.deleteMany({});
		await ProductVariant.deleteMany({});
		await Category.deleteMany({});
		await User.deleteMany({});

		const category = await Category.create({
			name: "Test Category",
			slug: `test-cat-${uuidv4()}`,
		});
		categoryId = category._id;
		const seller = await User.create({
			firstName: "Seller",
			lastName: "CartTest",
			email: `cartseller-${uuidv4()}@example.com`,
			passwordHash: "test",
			roles: ["seller"],
		});
		sellerId = seller._id;

		product1 = await Product.create({
			name: "Cart Product",
			slug: `cart-prod-${uuidv4()}`,
			description: "For cart testing",
			basePrice: 100,
			currency: "USD",
			categoryId,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
		});
		variant1_1 = await ProductVariant.create({
			productId: product1._id,
			sku: `CP-V1-${uuidv4()}`,
			attributes: { size: "M" },
			price: 100,
			stockQuantity: 10,
			isActive: true,
		});
		variant1_2 = await ProductVariant.create({
			productId: product1._id,
			sku: `CP-V2-${uuidv4()}`,
			attributes: { size: "L" },
			price: 105,
			stockQuantity: 5,
			isActive: true,
		});
	});

	describe("POST /api/v1/carts (Create Cart)", () => {
		it("should create a new anonymous cart and add the first item", async () => {
			const res = await request
				.post("/api/v1/carts")
				.send({
					productId: product1._id,
					variantId: variant1_1._id,
					quantity: 2,
				})
				.expect(201);

			expect(res.body.id).toBeDefined(); // This is the anonymousCartToken
			expect(res.body.items.length).toBe(1);
			expect(res.body.items[0].variantId).toBe(variant1_1._id.toString());
			expect(res.body.items[0].quantity).toBe(2);
			expect(res.body.subtotal).toBe(200); // 2 * 100
			expect(res.body.userId).toBeNull();

			const dbCart = await Cart.findOne({ anonymousCartToken: res.body.id });
			expect(dbCart).not.toBeNull();
		});

		it("should return 400 if stock is insufficient", async () => {
			await request
				.post("/api/v1/carts")
				.send({
					productId: product1._id,
					variantId: variant1_1._id,
					quantity: 20,
				}) // stock is 10
				.expect(400);
		});
	});

	describe("Anonymous Cart Operations (with existing cartId)", () => {
		let anonymousCartId;
		let initialCartItemId;

		beforeEach(async () => {
			// Create a cart first
			const createRes = await request.post("/api/v1/carts").send({
				productId: product1._id,
				variantId: variant1_1._id,
				quantity: 1,
			});
			anonymousCartId = createRes.body.id;
			initialCartItemId = createRes.body.items[0].id;
		});

		describe("POST /api/v1/carts/:cartId/items (Add Item)", () => {
			it("should add a new item to an existing anonymous cart", async () => {
				const res = await request
					.post(`/api/v1/carts/${anonymousCartId}/items`)
					.send({
						productId: product1._id,
						variantId: variant1_2._id,
						quantity: 1,
					})
					.expect(200);

				expect(res.body.items.length).toBe(2);
				const addedItem = res.body.items.find(
					(item) => item.variantId === variant1_2._id.toString(),
				);
				expect(addedItem).toBeDefined();
				expect(addedItem.quantity).toBe(1);
			});

			it("should increase quantity if item already exists in cart", async () => {
				const res = await request
					.post(`/api/v1/carts/${anonymousCartId}/items`)
					.send({
						productId: product1._id,
						variantId: variant1_1._id,
						quantity: 2,
					}) // Already 1 in cart
					.expect(200);

				expect(res.body.items.length).toBe(1);
				expect(res.body.items[0].quantity).toBe(3); // 1 + 2
			});

			it("should return 404 if cartId is invalid", async () => {
				await request
					.post(`/api/v1/carts/${uuidv4()}/items`)
					.send({
						productId: product1._id,
						variantId: variant1_2._id,
						quantity: 1,
					})
					.expect(404);
			});
		});

		describe("GET /api/v1/carts/:cartId (View Cart)", () => {
			it("should retrieve the anonymous cart details", async () => {
				const res = await request
					.get(`/api/v1/carts/${anonymousCartId}`)
					.expect(200);
				expect(res.body.id).toBe(anonymousCartId);
				expect(res.body.items.length).toBe(1);
			});

			it("should return 404 if cartId is invalid", async () => {
				await request.get(`/api/v1/carts/${uuidv4()}`).expect(404);
			});
		});

		describe("PUT /api/v1/carts/:cartId/items/:itemId (Update Item)", () => {
			it("should update the quantity of an item in the cart", async () => {
				const res = await request
					.put(`/api/v1/carts/${anonymousCartId}/items/${initialCartItemId}`)
					.send({ quantity: 3 })
					.expect(200);

				expect(res.body.items[0].quantity).toBe(3);
			});

			it("should return 404 if item is not in the cart", async () => {
				await request
					.put(`/api/v1/carts/${anonymousCartId}/items/${uuidv4()}`)
					.send({ quantity: 3 })
					.expect(404);
			});

			it("should return 400 if quantity is invalid (e.g., 0 or less for PUT)", async () => {
				await request
					.put(`/api/v1/carts/${anonymousCartId}/items/${initialCartItemId}`)
					.send({ quantity: 0 }) // DTO validation should catch this if min(1)
					.expect(400); // Or 422 if your validator returns that
			});
		});

		describe("DELETE /api/v1/carts/:cartId/items/:itemId (Remove Item)", () => {
			it("should remove an item from the cart", async () => {
				// Add a second item to test removal properly
				const addRes = await request
					.post(`/api/v1/carts/${anonymousCartId}/items`)
					.send({
						productId: product1._id,
						variantId: variant1_2._id,
						quantity: 1,
					});
				const itemToRemoveId = addRes.body.items.find(
					(i) => i.variantId === variant1_2._id.toString(),
				).id;

				const res = await request
					.delete(`/api/v1/carts/${anonymousCartId}/items/${itemToRemoveId}`)
					.expect(200);

				expect(res.body.items.length).toBe(1);
				expect(
					res.body.items.find((item) => item.id === itemToRemoveId),
				).toBeUndefined();
			});

			it("should return 404 if item to remove is not found", async () => {
				await request
					.delete(`/api/v1/carts/${anonymousCartId}/items/${uuidv4()}`)
					.expect(404);
			});
		});

		describe("DELETE /api/v1/carts/:cartId (Clear Cart)", () => {
			it("should remove all items from the cart", async () => {
				// Add a second item
				await request.post(`/api/v1/carts/${anonymousCartId}/items`).send({
					productId: product1._id,
					variantId: variant1_2._id,
					quantity: 1,
				});

				const res = await request
					.delete(`/api/v1/carts/${anonymousCartId}`)
					.expect(200);
				expect(res.body.items.length).toBe(0);
				expect(res.body.totalItems).toBe(0);
				expect(res.body.totalQuantity).toBe(0);
				expect(res.body.subtotal).toBe(0);

				const dbCartItems = await CartItem.find({ cartId: anonymousCartId }); // Should use the internal _id
				const dbCart = await Cart.findOne({
					anonymousCartToken: anonymousCartId,
				});
				const dbCartItemsUsingInternalId = await CartItem.find({
					cartId: dbCart._id,
				});
				expect(dbCartItemsUsingInternalId.length).toBe(0);
			});

			it("should return 404 if cart to clear is not found", async () => {
				await request.delete(`/api/v1/carts/${uuidv4()}`).expect(404);
			});
		});
	});
});
