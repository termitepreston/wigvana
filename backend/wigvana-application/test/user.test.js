import { MongoDBContainer } from "@testcontainers/mongodb";
import mongoose from "mongoose";
import { afterAll, beforeAll, afterEach, describe, expect, it } from "vitest";
import User from "../src/models/user.model.js";

let mongoContainer;

beforeAll(async () => {
	mongoContainer = await new MongoDBContainer("mongo:8").start();

	mongoose.connect(mongoContainer.getConnectionString(), {
		directConnection: true,
	});
});

afterEach(async () => {
	await User.deleteMany({});
});

describe("Test User model for functionality", () => {
	it("Should hash a given password", async () => {
		const password = "pass1234";

		const newUser = await User.create({
			email: "john@gmail.com",
			password: password,
		});

		expect(newUser.password).not.toBe(password);
	});

	it("Should correctly verify a matching password", async () => {
		const password = "pass1234";

		const newUser = await User.create({
			email: "john@gmail.com",
			password: password,
		});

		expect(await newUser.comparePassword(password)).toBe(true);
	});

	it("Should have a unique email.", async () => {
		expect(async () => {
			await User.create({
				email: "john@example.com",
				password: "1234",
			});

			await User.create({
				email: "john@example.com",
				password: "1234",
			});
		}).rejects.toThrowError();
	});

	it("Should only accept a valid email address.", async () => {
		expect(
			async () =>
				await User.create({
					email: "john@@example.com",
					password: 1234,
				}),
		).rejects.toThrow();
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoContainer.stop();
});
