import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	beforeEach,
	vi,
} from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Product from "../../src/models/Product.model.js";
import Category from "../../src/models/Category.model.js";
import ProductImage from "../../src/models/ProductImage.model.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

const loginUserAndGetToken = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

// Mock the ProductImage model's create and deleteOne for S3 simulation
// This is a very basic mock. In a real scenario, you'd mock the S3 upload/delete functions.
vi.mock("../../src/models/ProductImage.model.js", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		default: {
			...actual.default,
			create: vi.fn(async (data) => {
				// Simulate save and return a Mongoose-like document
				const id = uuidv4();
				return {
					_id: id,
					id,
					...data,
					toObject: () => ({ id, ...data }),
					save: vi.fn().mockResolvedValue({ id, ...data }),
					deleteOne: vi
						.fn()
						.mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
				};
			}),
			findOne: actual.default.findOne, // Use actual findOne for delete test
			countDocuments: actual.default.countDocuments,
			// deleteOne on instance will be mocked if findOne returns mocked obj
		},
	};
});

describe("Seller Product Management Endpoints (/me/products)", () => {
	let sellerUser;
	let sellerToken;
	let category1;

	const __dirname = path.dirname(new URL(import.meta.url).pathname);
	const testImagePath = path.join(__dirname, "../fixtures/test-image.png"); // Create a dummy image file

	beforeAll(async () => {
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(global.testConfig.MONGO_URI, {
				directConnection: true,
			});
		}
		// Create dummy image file if it doesn't exist
		if (!fs.existsSync(testImagePath)) {
			fs.writeFileSync(testImagePath, "dummy image content");
		}
	});

	afterAll(async () => {
		await mongoose.disconnect();
		if (redisService.client && redisService.client.status === "ready") {
			await redisService.client.quit();
		}
		// Clean up dummy image file
		// if (fs.existsSync(testImagePath)) {
		//     fs.unlinkSync(testImagePath);
		// }
	});

	beforeEach(async () => {
		vi.clearAllMocks(); // Clear mocks before each test, especially for ProductImage.create

		await User.deleteMany({});
		await Product.deleteMany({});
		await Category.deleteMany({});
		await ProductImage.deleteMany({}); // Use actual deleteMany if schema is real
		await redisService.client.flushdb();

		const rawPassword = "sellerProdPass";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);
		sellerUser = await User.create({
			firstName: "ProdSeller",
			lastName: "Owner",
			email: `prodseller-${uuidv4()}@example.com`,
			passwordHash: hashedPassword,
			roles: ["seller"],
			emailVerified: true,
			accountStatus: "active",
		});
		sellerToken = await loginUserAndGetToken(sellerUser.email, rawPassword);

		category1 = await Category.create({
			name: "Seller Category",
			slug: `seller-cat-${uuidv4()}`,
			isActive: true,
		});
	});

	const productData = {
		name: "My New Gadget",
		description: "An amazing new gadget for all your needs.",
		categoryId: "", // Will be set in test
		basePrice: 99.99,
		currency: "USD",
	};

	describe("POST /api/v1/me/products", () => {
		it("should create a new product for the seller", async () => {
			const res = await request
				.post("/api/v1/me/products")
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ ...productData, categoryId: category1._id.toString() })
				.expect(201);

			expect(res.body.name).toBe(productData.name);
			expect(res.body.sellerId.toString()).toBe(sellerUser._id.toString());
			expect(res.body.approvalStatus).toBe("pending"); // Default for new products
			const dbProduct = await Product.findById(res.body.id);
			expect(dbProduct).not.toBeNull();
		});
	});

	describe("GET /api/v1/me/products", () => {
		beforeEach(async () => {
			await Product.create({
				...productData,
				sellerId: sellerUser._id,
				categoryId: category1._id,
				name: "Gadget A",
				approvalStatus: "approved",
				isPublished: true,
			});
			await Product.create({
				...productData,
				sellerId: sellerUser._id,
				categoryId: category1._id,
				name: "Gadget B (Draft)",
				approvalStatus: "approved",
				isPublished: false,
			});
			const otherSeller = await User.create({
				firstName: "Other",
				lastName: "Seller",
				email: `other-${uuidv4()}@example.com`,
				passwordHash: "test",
				roles: ["seller"],
				emailVerified: true,
				accountStatus: "active",
			});
			await Product.create({
				...productData,
				sellerId: otherSeller._id,
				categoryId: category1._id,
				name: "Other Seller Gadget",
			});
		});

		it("should list products owned by the seller", async () => {
			const res = await request
				.get("/api/v1/me/products")
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(2); // Only Gadget A and Gadget B (Draft)
			expect(
				res.body.results.every(
					(p) => p.sellerId.toString() === sellerUser._id.toString(),
				),
			).toBe(true);
		});

		it('should filter seller products by status "draft"', async () => {
			const res = await request
				.get("/api/v1/me/products?status=draft")
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].name).toBe("Gadget B (Draft)");
		});
	});

	describe("Operations on a specific seller product", () => {
		let testProduct;
		beforeEach(async () => {
			testProduct = await Product.create({
				...productData,
				categoryId: category1._id,
				sellerId: sellerUser._id,
				approvalStatus: "approved",
			});
		});

		it("GET /api/v1/me/products/:productId - should get product details", async () => {
			const res = await request
				.get(`/api/v1/me/products/${testProduct._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(200);
			expect(res.body.name).toBe(testProduct.name);
		});

		it("PUT /api/v1/me/products/:productId - should update a product", async () => {
			const updatedName = "My Updated Gadget";
			const res = await request
				.put(`/api/v1/me/products/${testProduct._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ ...productData, categoryId: category1._id, name: updatedName })
				.expect(200);
			expect(res.body.name).toBe(updatedName);
			expect(res.body.approvalStatus).toBe("pending"); // Should be reset
		});

		it("PATCH /api/v1/me/products/:productId - should partially update a product", async () => {
			const newPrice = 129.99;
			const res = await request
				.patch(`/api/v1/me/products/${testProduct._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.send({ basePrice: newPrice })
				.expect(200);
			expect(res.body.basePrice).toBe(newPrice);
			expect(res.body.approvalStatus).toBe("pending"); // Price change might trigger re-approval
		});

		it("DELETE /api/v1/me/products/:productId - should delete a product", async () => {
			await request
				.delete(`/api/v1/me/products/${testProduct._id}`)
				.set("Authorization", `Bearer ${sellerToken}`)
				.expect(204);
			const dbProduct = await Product.findById(testProduct._id);
			expect(dbProduct).toBeNull();
		});

		describe("Product Image Uploads", () => {
			it("POST /api/v1/me/products/:productId/images - should upload product images", async () => {
				ProductImage.create.mockResolvedValueOnce({
					_id: uuidv4(),
					productId: testProduct._id,
					imageUrl: "http://example.com/img1.jpg",
					toObject: () => ({}),
				});

				const res = await request
					.post(`/api/v1/me/products/${testProduct._id}/images`)
					.set("Authorization", `Bearer ${sellerToken}`)
					.attach("images", testImagePath) // 'images' is the field name
					.expect(201);

				expect(ProductImage.create).toHaveBeenCalled();
				expect(res.body.length).toBe(1);
				expect(res.body[0].imageUrl).toContain("http://example.com/img1.jpg");
			});

			it("DELETE /api/v1/me/products/:productId/images/:imageId - should delete a product image", async () => {
				// Simulate an existing image
				const mockImageId = uuidv4();
				const mockImage = {
					_id: mockImageId,
					productId: testProduct._id,
					imageUrl: "http://example.com/to-delete.jpg",
					isCover: false,
					deleteOne: vi
						.fn()
						.mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
				};
				ProductImage.findOne = vi.fn().mockResolvedValue(mockImage); // Mock findOne to return our mock image

				await request
					.delete(
						`/api/v1/me/products/${testProduct._id}/images/${mockImageId}`,
					)
					.set("Authorization", `Bearer ${sellerToken}`)
					.expect(204);

				expect(ProductImage.findOne).toHaveBeenCalledWith({
					_id: mockImageId,
					productId: testProduct._id.toString(),
				});
				expect(mockImage.deleteOne).toHaveBeenCalled();
			});
		});
	});
});
