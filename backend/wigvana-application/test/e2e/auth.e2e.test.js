import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import Redis from "ioredis"; // For clearing Redis data between tests
import app from "../../src/app.js"; // Your Express app
import User from "../../src/models/User.model.js";
import logger from "../../src/utils/logger.js";
// testConfig is set globally by e2eSetup.js
// import config from '../../src/config/index.js'; // DO NOT import this directly, use global.testConfig

const request = supertest(app);
let testRedisClient;

beforeAll(async () => {
	// Connect Mongoose to the test database provided by Testcontainers
	// The URI is set in global.testConfig by e2eSetup.js
	if (mongoose.connection.readyState === 0) {
		logger.info(`MONGO_URI = ${global.testConfig.MONGO_URI}.`);

		await mongoose.connect(global.testConfig.MONGO_URI, {
			directConnection: true,
		});
	}
	// Connect a dedicated Redis client for test cleanup
	testRedisClient = new Redis(global.testConfig.REDIS_URL);
});

afterAll(async () => {
	await mongoose.disconnect();
	if (testRedisClient) await testRedisClient.quit();
});

beforeEach(async () => {
	// Clear database and Redis before each test
	await User.deleteMany({});
	await testRedisClient.flushdb(); // Clears the current Redis DB
});

describe("Auth Endpoints", () => {
	describe("POST /api/v1/auth/register", () => {
		it("should register a new user successfully", async () => {
			const userData = {
				firstName: "Test",
				lastName: "User",
				email: "test@example.com",
				password: "password123",
			};
			const res = await request
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(201);

			expect(res.body.user.email).toBe(userData.email);
			expect(res.body.accessToken).toBeDefined();
			expect(res.headers["set-cookie"]).toBeDefined(); // Check for refreshToken cookie

			const dbUser = await User.findOne({ email: userData.email });
			expect(dbUser).not.toBeNull();
			expect(dbUser.emailVerified).toBe(false);
			expect(dbUser.accountStatus).toBe("pending_verification");
		});

		it("should return 400 if email is already taken", async () => {
			const userData = {
				firstName: "Test",
				lastName: "User",
				email: "test@example.com",
				password: "password123",
			};
			await User.create({
				...userData,
				passwordHash: "hashed",
				emailVerificationToken: "token",
			}); // Pre-populate

			const res = await request
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(400);

			expect(res.body.message).toBe("Email already taken");
		});

		it("should return 400 for invalid registration data", async () => {
			const userData = {
				// Missing firstName, lastName
				email: "invalidemail", // Invalid email
				password: "123", // Too short
			};
			const res = await request
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(400);

			expect(res.body.message).toBe("Validation failed");
			expect(res.body.errors).toBeInstanceOf(Array);
			expect(res.body.errors.length).toBeGreaterThan(0);
		});
	});

	describe("GET /api/v1/auth/verify-email", () => {
		it("should verify email successfully with a valid token", async () => {
			const userData = {
				firstName: "Verify",
				lastName: "Email",
				email: "verify@example.com",
				password: "password123",
			};
			await request.post("/api/v1/auth/register").send(userData);
			const createdUser = await User.findOne({ email: userData.email });
			const verificationToken = createdUser.emailVerificationToken;

			expect(verificationToken).toBeDefined();

			const verifyRes = await request
				.get(`/api/v1/auth/verify-email?token=${verificationToken}`)
				.expect(200);

			expect(verifyRes.body.message).toBe(
				"Email verified successfully. You can now log in.",
			);
			const updatedUser = await User.findById(createdUser._id);

			expect(updatedUser.emailVerified).toBe(true);
			expect(updatedUser.accountStatus).toBe("active");
			expect(updatedUser.emailVerificationToken).toBeUndefined();
		});

		it("should return 400 for an invalid token", async () => {
			const res = await request
				.get("/api/v1/auth/verify-email?token=invalidtoken123")
				.expect(400);
			expect(res.body.message).toBe(
				"Invalid or expired email verification token.",
			);
		});
	});

	describe("POST /api/v1/auth/login", () => {
		let registeredUser;
		let plainPassword;

		beforeEach(async () => {
			plainPassword = "passwordSecure";
			const userData = {
				firstName: "Login",
				lastName: "User",
				email: "login@example.com",
				password: plainPassword,
			};
			// Register and manually verify for login tests
			await request.post("/api/v1/auth/register").send(userData);
			registeredUser = await User.findOne({ email: userData.email });
			registeredUser.emailVerified = true;
			registeredUser.accountStatus = "active";

			await registeredUser.save();
		});

		it("should login a verified user successfully", async () => {
			const res = await request
				.post("/api/v1/auth/login")
				.send({ email: registeredUser.email, password: plainPassword })
				.expect(200);

			expect(res.body.user.email).toBe(registeredUser.email);
			expect(res.body.accessToken).toBeDefined();
			expect(res.headers["set-cookie"]).toBeDefined();
		});

		it("should return 401 for incorrect password", async () => {
			await request
				.post("/api/v1/auth/login")
				.send({ email: registeredUser.email, password: "wrongpassword" })
				.expect(401);
		});

		it("should return 403 if email is not verified", async () => {
			registeredUser.emailVerified = false;
			registeredUser.accountStatus = "pending_verification";
			await registeredUser.save();

			await request
				.post("/api/v1/auth/login")
				.send({ email: registeredUser.email, password: plainPassword })
				.expect(403);
		});
	});

	// TODO: Add tests for /logout and /refresh-token
	// For /logout, you need to get the cookie first.
	// For /refresh-token, you also need the cookie.
	// Supertest can manage cookies across requests in a chain using .agent()
	// or you can manually extract and set them.
});
