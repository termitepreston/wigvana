import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import app from "../../src/app.js";
import Product from "../../src/models/Product.model.js";
import ProductVariant from "../../src/models/ProductVariant.model.js";
import Review from "../../src/models/Review.model.js";
import Category from "../../src/models/Category.model.js";
import User from "../../src/models/User.model.js"; // For review user
import { redisService } from "../../src/services/redis.service.js"; // For clearing cache

const FEATURED_PRODUCTS_CACHE_KEY = "featured_products";
const PRODUCT_DETAIL_CACHE_KEY_PREFIX = "product_detail:";
const PRODUCT_VARIANTS_CACHE_KEY_PREFIX = "product_variants:";

const request = supertest(app);

describe("Product Endpoints (Anonymous)", () => {
	let categoryId;
	let sellerId;
	let product1;
	let product2;
	let productFeatured;
	let variant1_1;
	let variant1_2;
	let review1;
	let review2;

	beforeAll(async () => {
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(global.testConfig.MONGO_URI, {
				directConnection: true,
			});
		}
		// Clear Redis cache related to products
		const keys = await redisService.client.keys("product_*");
		if (keys.length) await redisService.client.del(keys);
		await redisService.del("featured_products");
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await redisService.client.quit();
	});

	beforeEach(async () => {
		await Product.deleteMany({});
		await ProductVariant.deleteMany({});
		await Category.deleteMany({});
		await Review.deleteMany({});
		await User.deleteMany({}); // Clear users for review tests

		// Clear Redis cache related to products
		const keys = await redisService.client.keys(
			`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}*`,
		);
		if (keys.length) await redisService.client.del(keys);
		const variantKeys = await redisService.client.keys(
			`${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}*`,
		);
		if (variantKeys.length) await redisService.client.del(variantKeys);
		await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);

		const category = await Category.create({
			name: "Electronics",
			slug: "electronics",
			isActive: true,
		});
		categoryId = category._id;

		const seller = await User.create({
			firstName: "Seller",
			lastName: "User",
			email: `seller-${uuidv4()}@example.com`,
			passwordHash: "hashed",
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerId = seller._id;

		product1 = await Product.create({
			name: "Laptop Pro",
			slug: "laptop-pro",
			description: "Powerful laptop",
			basePrice: 1200,
			currency: "USD",
			categoryId,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
			averageRating: 4.5,
			reviewCount: 10,
			brand: "TechBrand",
		});
		product2 = await Product.create({
			name: "Smartphone X",
			slug: "smartphone-x",
			description: "Latest smartphone",
			basePrice: 800,
			currency: "USD",
			categoryId,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
			averageRating: 4.2,
			reviewCount: 5,
		});
		productFeatured = await Product.create({
			name: "Featured Tablet",
			slug: "featured-tablet",
			description: "Top tablet",
			basePrice: 500,
			currency: "USD",
			categoryId,
			sellerId,
			isPublished: true,
			approvalStatus: "approved",
			isFeatured: true,
		});
		// Unpublished product
		await Product.create({
			name: "Unpublished Gadget",
			slug: "unpublished-gadget",
			description: "Not yet live",
			basePrice: 100,
			currency: "USD",
			categoryId,
			sellerId,
			isPublished: false,
			approvalStatus: "approved",
		});

		variant1_1 = await ProductVariant.create({
			productId: product1._id,
			sku: "LP-PRO-001",
			attributes: { color: "Silver", storage: "512GB" },
			price: 1200,
			stockQuantity: 10,
			isActive: true,
		});
		variant1_2 = await ProductVariant.create({
			productId: product1._id,
			sku: "LP-PRO-002",
			attributes: { color: "Space Gray", storage: "1TB" },
			price: 1500,
			stockQuantity: 5,
			isActive: true,
		});
		await ProductVariant.create({
			productId: product1._id,
			sku: "LP-PRO-003",
			attributes: { color: "Black", storage: "256GB" },
			price: 1100,
			stockQuantity: 0,
			isActive: false,
		}); // Inactive variant

		const reviewUser = await User.create({
			firstName: "Reviewer",
			lastName: "Person",
			email: `reviewer-${uuidv4()}@example.com`,
			passwordHash: "hashed",
			emailVerified: true,
			accountStatus: "active",
		});
		review1 = await Review.create({
			productId: product1._id,
			userId: reviewUser._id,
			rating: 5,
			comment: "Excellent!",
			title: "Great Laptop",
			isApproved: true,
		});
		review2 = await Review.create({
			productId: product1._id,
			userId: reviewUser._id,
			rating: 4,
			comment: "Very good.",
			title: "Good Value",
			isApproved: true,
		});
		await Review.create({
			productId: product1._id,
			userId: reviewUser._id,
			rating: 3,
			comment: "Okay.",
			title: "Decent",
			isApproved: false,
		}); // Unapproved review
	});

	describe("GET /api/v1/products", () => {
		it("should return a list of published and approved products", async () => {
			const res = await request.get("/api/v1/products").expect(200);
			expect(res.body.results.length).toBe(3); // product1, product2, productFeatured
			expect(
				res.body.results.every(
					(p) => p.isPublished && p.approvalStatus === "approved",
				),
			).toBe(true);
		});

		it("should filter products by categoryId", async () => {
			const otherCategory = await Category.create({
				name: "Books",
				slug: "books",
				isActive: true,
			});
			await Product.create({
				name: "Sci-Fi Novel",
				slug: "sci-fi-novel",
				description: "A great read",
				basePrice: 20,
				currency: "USD",
				categoryId: otherCategory._id,
				sellerId,
				isPublished: true,
				approvalStatus: "approved",
			});
			const res = await request
				.get(`/api/v1/products?category=${categoryId}`)
				.expect(200);
			expect(res.body.results.length).toBe(3);
			expect(
				res.body.results.every(
					(p) => p.categoryId._id.toString() === categoryId.toString(),
				),
			).toBe(true);
		});

		it("should filter products by search query", async () => {
			// Ensure text index is built for testing (might take a moment after create)
			// In a real test setup, you might await index creation or use a small delay.
			// For now, let's assume it's fast enough for simple test data.
			await Product.createIndexes();
			const res = await request
				.get("/api/v1/products?search=Laptop")
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Laptop Pro");
		});

		it("should sort products by basePrice in ascending order", async () => {
			const res = await request
				.get("/api/v1/products?sort_by=basePrice&order=asc")
				.expect(200);
			expect(res.body.results.length).toBe(3);
			expect(res.body.results[0].name).toBe("Featured Tablet"); // 500
			expect(res.body.results[1].name).toBe("Smartphone X"); // 800
			expect(res.body.results[2].name).toBe("Laptop Pro"); // 1200
		});

		it("should paginate products", async () => {
			const res = await request
				.get("/api/v1/products?limit=1&page=2&sort_by=basePrice&order=asc")
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Smartphone X");
			expect(res.body.page).toBe(2);
			expect(res.body.limit).toBe(1);
			expect(res.body.totalPages).toBe(3);
		});
	});

	describe("GET /api/v1/products/featured", () => {
		it("should return featured products", async () => {
			const res = await request.get("/api/v1/products/featured").expect(200);
			expect(res.body.length).toBe(1);
			expect(res.body[0].name).toBe("Featured Tablet");
			expect(res.body[0].isFeatured).toBe(true);
		});
	});

	describe("GET /api/v1/products/:productId", () => {
		it("should return product details for a valid ID", async () => {
			const res = await request
				.get(`/api/v1/products/${product1._id}`)
				.expect(200);
			expect(res.body.name).toBe(product1.name);
		});

		it("should return 404 for a non-existent product ID", async () => {
			await request.get(`/api/v1/products/${uuidv4()}`).expect(404);
		});

		it("should return 404 for an unpublished product", async () => {
			const unpublished = await Product.findOne({ isPublished: false });
			await request.get(`/api/v1/products/${unpublished._id}`).expect(404);
		});
	});

	describe("GET /api/v1/products/:productId/variants", () => {
		it("should return active variants for a product", async () => {
			const res = await request
				.get(`/api/v1/products/${product1._id}/variants`)
				.expect(200);
			expect(res.body.length).toBe(2); // variant1_1, variant1_2
			expect(res.body.every((v) => v.isActive === true)).toBe(true);
		});

		it("should return 404 if product not found", async () => {
			await request.get(`/api/v1/products/${uuidv4()}/variants`).expect(404);
		});
	});

	describe("GET /api/v1/products/:productId/variants/:variantId", () => {
		it("should return specific active variant details", async () => {
			const res = await request
				.get(`/api/v1/products/${product1._id}/variants/${variant1_1._id}`)
				.expect(200);
			expect(res.body.sku).toBe(variant1_1.sku);
		});

		it("should return 404 if variant not found", async () => {
			await request
				.get(`/api/v1/products/${product1._id}/variants/${uuidv4()}`)
				.expect(404);
		});

		it("should return 404 if variant is inactive", async () => {
			const inactiveVariant = await ProductVariant.findOne({ isActive: false });
			await request
				.get(`/api/v1/products/${product1._id}/variants/${inactiveVariant._id}`)
				.expect(404);
		});
	});

	describe("GET /api/v1/products/:productId/reviews", () => {
		it("should return approved reviews for a product", async () => {
			const res = await request
				.get(`/api/v1/products/${product1._id}/reviews`)
				.expect(200);
			expect(res.body.results.length).toBe(2);
			expect(res.body.results.every((r) => r.rating > 0)).toBe(true); // Check a field from formatted reviews
			expect(res.body.results[0].user.firstName).toBe("Reviewer");
		});

		it("should paginate reviews", async () => {
			const res = await request
				.get(`/api/v1/products/${product1._id}/reviews?limit=1&page=1`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.page).toBe(1);
			expect(res.body.totalPages).toBe(2);
		});

		it("should return 404 if product not found when fetching reviews", async () => {
			await request.get(`/api/v1/products/${uuidv4()}/reviews`).expect(404);
		});
	});
});
