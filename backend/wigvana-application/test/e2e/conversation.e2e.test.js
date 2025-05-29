import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import User from "../../src/models/User.model.js";
import Conversation from "../../src/models/Conversation.model.js";
import ChatMessage from "../../src/models/ChatMessage.model.js";
import { authService } from "../../src/services/auth.service.js";
import { redisService } from "../../src/services/redis.service.js";

const request = supertest(app);

// Helper to login a user and get token
const loginUser = async (email, password) => {
	const res = await request
		.post("/api/v1/auth/login")
		.send({ email, password });
	return res.body.accessToken;
};

describe("Conversations & Messages Endpoints (Authenticated General)", () => {
	let user1;
	let user2;
	let user3;
	let token1;
	let token2;
	let token3;
	let conversation12;
	let conversation13;

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
		await Conversation.deleteMany({});
		await ChatMessage.deleteMany({});
		await redisService.client.flushdb();

		const commonPassword = "password123";
		const hashedCommonPassword = await bcrypt.hash(commonPassword, 10);

		user1 = await User.create({
			firstName: "Alice",
			lastName: "A",
			email: "alice@example.com",
			passwordHash: hashedCommonPassword,
			emailVerified: true,
			accountStatus: "active",
		});
		user2 = await User.create({
			firstName: "Bob",
			lastName: "B",
			email: "bob@example.com",
			passwordHash: hashedCommonPassword,
			emailVerified: true,
			accountStatus: "active",
		});
		user3 = await User.create({
			firstName: "Charlie",
			lastName: "C",
			email: "charlie@example.com",
			passwordHash: hashedCommonPassword,
			emailVerified: true,
			accountStatus: "active",
		});

		token1 = await loginUser("alice@example.com", commonPassword);
		token2 = await loginUser("bob@example.com", commonPassword);
		token3 = await loginUser("charlie@example.com", commonPassword);

		conversation12 = await Conversation.create({
			buyerId: user1._id,
			sellerId: user2._id,
			lastMessageAt: new Date(),
		});
		conversation13 = await Conversation.create({
			buyerId: user1._id,
			sellerId: user3._id,
			lastMessageAt: new Date(Date.now() - 10000),
		}); // Older
		await Conversation.create({ buyerId: user2._id, sellerId: user3._id }); // Convo not involving user1
	});

	describe("GET /api/v1/me/conversations", () => {
		it("should list user1's conversations", async () => {
			const res = await request
				.get("/api/v1/me/conversations")
				.set("Authorization", `Bearer ${token1}`)
				.expect(200);

			expect(res.body.results.length).toBe(2);
			expect(res.body.results.map((c) => c.id)).toEqual(
				expect.arrayContaining([
					conversation12._id.toString(),
					conversation13._id.toString(),
				]),
			);
			// Check if sorted by lastMessageAt desc (default)
			expect(
				new Date(res.body.results[0].lastMessageAt).getTime(),
			).toBeGreaterThanOrEqual(
				new Date(res.body.results[1].lastMessageAt).getTime(),
			);
		});

		it("should paginate user1's conversations", async () => {
			const res = await request
				.get("/api/v1/me/conversations?limit=1&page=1")
				.set("Authorization", `Bearer ${token1}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.totalPages).toBe(2);
		});

		it("should filter conversations by status (e.g., active)", async () => {
			await Conversation.findByIdAndUpdate(conversation12._id, {
				statusByBuyer: "archived",
			}); // Archive one for user1 as buyer
			const res = await request
				.get("/api/v1/me/conversations?status=active")
				.set("Authorization", `Bearer ${token1}`)
				.expect(200);
			expect(res.body.results.length).toBe(1);
			expect(res.body.results[0].id).toBe(conversation13._id.toString()); // Only active one
		});
	});

	describe("GET /api/v1/conversations/:conversationId", () => {
		it("should get details of a specific conversation for a participant (user1)", async () => {
			const res = await request
				.get(`/api/v1/conversations/${conversation12._id}`)
				.set("Authorization", `Bearer ${token1}`)
				.expect(200);
			expect(res.body.id).toBe(conversation12._id.toString());
			expect(res.body.otherParticipant.userId).toBe(user2._id.toString());
		});

		it("should get details of a specific conversation for the other participant (user2)", async () => {
			const res = await request
				.get(`/api/v1/conversations/${conversation12._id}`)
				.set("Authorization", `Bearer ${token2}`)
				.expect(200);
			expect(res.body.id).toBe(conversation12._id.toString());
			expect(res.body.otherParticipant.userId).toBe(user1._id.toString());
		});

		it("should return 403 if user is not a participant", async () => {
			await request
				.get(`/api/v1/conversations/${conversation12._id}`)
				.set("Authorization", `Bearer ${token3}`) // User3 is not in conversation12
				.expect(403); // Or 404 depending on service logic (NotFound is also fine)
		});

		it("should return 404 for a non-existent conversation ID", async () => {
			await request
				.get(`/api/v1/conversations/${uuidv4()}`)
				.set("Authorization", `Bearer ${token1}`)
				.expect(404);
		});

		it("should mark messages as read when conversation is viewed", async () => {
			await ChatMessage.create({
				conversationId: conversation12._id,
				senderId: user2._id,
				receiverId: user1._id,
				messageText: "Unread msg",
			});
			await Conversation.findByIdAndUpdate(conversation12._id, {
				buyerUnreadCount: 1,
			});

			const res = await request
				.get(`/api/v1/conversations/${conversation12._id}`)
				.set("Authorization", `Bearer ${token1}`) // User1 views
				.expect(200);

			expect(res.body.unreadCount).toBe(0); // Should be 0 after viewing
			const updatedConvo = await Conversation.findById(conversation12._id);
			expect(updatedConvo.buyerUnreadCount).toBe(0);
			const msg = await ChatMessage.findOne({
				conversationId: conversation12._id,
				senderId: user2._id,
			});
			expect(msg.readAt).toBeInstanceOf(Date);
		});
	});

	describe("POST /api/v1/conversations/:conversationId/messages", () => {
		it("should allow a participant (user1) to send a message", async () => {
			const messageData = { messageText: "Hello Bob from Alice!" };
			const res = await request
				.post(`/api/v1/conversations/${conversation12._id}/messages`)
				.set("Authorization", `Bearer ${token1}`)
				.send(messageData)
				.expect(201);

			expect(res.body.messageText).toBe(messageData.messageText);
			expect(res.body.senderId).toBe(user1._id.toString());
			expect(res.body.receiverId).toBe(user2._id.toString());

			const convo = await Conversation.findById(conversation12._id);
			expect(convo.lastMessageSnippet).toBe(messageData.messageText);
			expect(convo.sellerUnreadCount).toBe(1); // User2 (seller) has 1 unread
		});

		it("should allow the other participant (user2) to reply", async () => {
			const messageData = { messageText: "Hi Alice from Bob!" };
			const res = await request
				.post(`/api/v1/conversations/${conversation12._id}/messages`)
				.set("Authorization", `Bearer ${token2}`)
				.send(messageData)
				.expect(201);

			expect(res.body.senderId).toBe(user2._id.toString());
			expect(res.body.receiverId).toBe(user1._id.toString());

			const convo = await Conversation.findById(conversation12._id);
			expect(convo.buyerUnreadCount).toBe(1); // User1 (buyer) has 1 unread
		});

		it("should return 403 if user is not a participant trying to send a message", async () => {
			await request
				.post(`/api/v1/conversations/${conversation12._id}/messages`)
				.set("Authorization", `Bearer ${token3}`)
				.send({ messageText: "Intruder!" })
				.expect(403); // Or 404
		});

		it("should return 400 for empty message text", async () => {
			await request
				.post(`/api/v1/conversations/${conversation12._id}/messages`)
				.set("Authorization", `Bearer ${token1}`)
				.send({ messageText: "" })
				.expect(400);
		});
	});
});
