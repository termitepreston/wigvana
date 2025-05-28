import { describe, expect, it, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { MongoDBContainer } from "@testcontainers/mongodb";
import mongoose from "mongoose";
import app from "../src/app.js";

let mongoContainer;
const request = supertest(app);

beforeAll(
	async () => {
		mongoContainer = await new MongoDBContainer("mongo:8").start();

		mongoose.connect(mongoContainer.getConnectionString(), {
			directConnection: true,
		});
	},
	10 * 60 * 1000,
);

describe("Mongoose is working", () => {
	it("Should add to the model", async () => {
		const userSchema = new mongoose.Schema({
			username: String,
			age: {
				type: Number,
				min: 13,
				max: 30,
			},
		});

		const User = mongoose.model("User", userSchema);

		const alazar = new User({
			username: "ag",
			age: 27,
		});

		await alazar.save();

		const ag = await User.findOne({ username: "ag" });

		expect(ag.age).toBe(27);
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoContainer.stop();
});
