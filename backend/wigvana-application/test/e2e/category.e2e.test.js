import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import app from "../../src/app.js";
import Category from "../../src/models/Category.model.js";
import Product from "../../src/models/Product.model.js";
import User from "../../src/models/User.model.js"; // For sellerId in product

const request = supertest(app);

describe("Category Endpoints (Anonymous)", () => {
	let category1;
	let category2;
	let subCategory1;
	let productInCat1;
	let productInCat2;
	let sellerId;

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
		await Category.deleteMany({});
		await Product.deleteMany({});
		await User.deleteMany({});

		const seller = await User.create({
			firstName: "Seller",
			lastName: "Test",
			email: `catseller-${uuidv4()}@example.com`,
			passwordHash: "test",
			roles: ["seller"],
		});
		sellerId = seller._id;

		category1 = await Category.create({
			name: "Electronics",
			slug: "electronics",
			isActive: true,
			displayOrder: 1,
		});
		category2 = await Category.create({
			name: "Books",
			slug: "books",
			isActive: true,
			displayOrder: 2,
		});
		subCategory1 = await Category.create({
			name: "Smartphones",
			slug: "smartphones",
			parentId: category1._id,
			isActive: true,
		});
		await Category.create({
			name: "Inactive Category",
			slug: "inactive-cat",
			isActive: false,
		});

		productInCat1 = await Product.create({
			name: "Phone Model A",
			slug: `phone-a-${uuidv4()}`,
			description: "A phone",
			basePrice: 300,
			currency: "USD",
			categoryId: subCategory1._id,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
		});
		productInCat2 = await Product.create({
			name: "Laptop Model Z",
			slug: `laptop-z-${uuidv4()}`,
			description: "A laptop",
			basePrice: 1300,
			currency: "USD",
			categoryId: category1._id,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
		});
		await Product.create({
			// Product in another category
			name: "Fantasy Novel",
			slug: `fantasy-${uuidv4()}`,
			description: "A book",
			basePrice: 25,
			currency: "USD",
			categoryId: category2._id,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
		});
	});

	describe("GET /api/v1/categories", () => {
		it("should return a list of active categories", async () => {
			const res = await request.get("/api/v1/categories").expect(200);
			expect(res.body.results.length).toBe(3); // category1, category2, subCategory1
			expect(res.body.results.every((c) => c.isActive === true)).toBe(true);
		});

		it("should filter categories by name (partial match)", async () => {
			const res = await request
				.get("/api/v1/categories?name=Electro")
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Electronics");
		});

		it("should filter for top-level categories using parentId=null", async () => {
			const res = await request
				.get("/api/v1/categories?parentId=null")
				.expect(200);
			expect(res.body.results.length).toBe(2); // category1, category2
			expect(res.body.results.every((c) => c.parentId === null)).toBe(true);
		});

		it("should filter by specific parentId", async () => {
			const res = await request
				.get(`/api/v1/categories?parentId=${category1._id}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Smartphones");
		});

		it("should paginate categories", async () => {
			const res = await request
				.get("/api/v1/categories?limit=1&page=1&sort_by=name&order=asc")
				.expect(200);
			// This depends on actual sorting, assuming 'Books' comes first alphabetically among top-level
			// Or adjust test data/sort for predictability
			expect(res.body.results.length).toBe(1);
			expect(res.body.page).toBe(1);
			// Total active categories = 3
			expect(res.body.totalPages).toBe(3);
		});
	});

	describe("GET /api/v1/categories/:categoryId", () => {
		it("should return category details for a valid ID", async () => {
			const res = await request
				.get(`/api/v1/categories/${category1._id}`)
				.expect(200);
			expect(res.body.name).toBe(category1.name);
		});

		it("should return 404 for a non-existent category ID", async () => {
			await request.get(`/api/v1/categories/${uuidv4()}`).expect(404);
		});

		it("should return 404 for an inactive category", async () => {
			const inactiveCat = await Category.findOne({ isActive: false });
			await request.get(`/api/v1/categories/${inactiveCat._id}`).expect(404);
		});
	});

	describe("GET /api/v1/categories/:categoryId/products", () => {
		it("should return products within a specific category", async () => {
			const res = await request
				.get(`/api/v1/categories/${category1._id}/products`)
				.expect(200);
			// productInCat2 is directly in category1
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Laptop Model Z");
		});

		it("should return products within a sub-category", async () => {
			const res = await request
				.get(`/api/v1/categories/${subCategory1._id}/products`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Phone Model A");
		});

		it("should paginate products within a category", async () => {
			// Add another product to category1 for pagination test
			await Product.create({
				name: "Desktop PC",
				slug: `desktop-pc-${uuidv4()}`,
				description: "Powerful PC",
				basePrice: 1000,
				currency: "USD",
				categoryId: category1._id,
				sellerId,
				isPublished: true,
				approvalStatus: "approved",
			});
			const res = await request
				.get(
					`/api/v1/categories/${category1._id}/products?limit=1&page=1&sort_by=name&order=asc`,
				)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.page).toBe(1);
			expect(res.body.totalPages).toBe(2); // Now 2 products in category1
			expect(res.body.results[0].name).toBe("Desktop PC"); // Assuming 'Desktop PC' comes before 'Laptop Model Z'
		});

		it("should return 404 if category for products not found", async () => {
			await request.get(`/api/v1/categories/${uuidv4()}/products`).expect(404);
		});
	});
});
