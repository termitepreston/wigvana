// test/setup/e2eSetup.js
import { afterAll, beforeAll } from "vitest";
import { MongoDBContainer } from "@testcontainers/mongodb";
import { RedisContainer } from "@testcontainers/redis";

import mongoose from "mongoose";
import config from "../../src/config/index.js"; // To override with test container URLs
import logger from "../../src/utils/logger.js";

let mongoContainer;
let redisContainer;

// Override config for tests
global.testConfig = { ...config };

const TIMEOUT = 10 * 60 * 1000;

beforeAll(async () => {
	logger.info("Setting up E2E test environment...");
	try {
		mongoContainer = await new MongoDBContainer("mongo:8").start();

		redisContainer = await new RedisContainer().start();

		const mongoUri = mongoContainer.getConnectionString();
		global.testConfig.MONGO_URI = mongoUri;

		const redisHost = redisContainer.getHost();
		const redisPort = redisContainer.getMappedPort(6379);
		global.testConfig.REDIS_URL = `redis://${redisHost}:${redisPort}`;

		logger.info(
			`E2E test: Redis host = ${redisHost}; redis port = ${redisPort}; mongoDB URI = ${mongoUri}; Redis URL = ${global.testConfig.REDIS_URL}.`,
		);

		// Now that URIs are set, you can connect mongoose and ioredis for the test run
		// (or let the app connect when it starts for each test suite)
		// This global setup is more for providing the URLs.
		// Actual connection might happen in individual test suite's beforeAll if app is started per suite.
		logger.info(
			`MongoDB test container started at: ${global.testConfig.MONGO_URI}`,
		);
		logger.info(
			`Redis test container started at: ${global.testConfig.REDIS_URL}`,
		);
	} catch (error) {
		logger.error("Failed to start test containers:", error);
		process.exit(1);
	}
}, TIMEOUT); // Increased timeout for beforeAll

afterAll(async () => {
	logger.info("Tearing down E2E test environment...");
	try {
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			logger.info("Mongoose disconnected for tests.");
		}
		// If redis client was globally created for tests, disconnect it
		// e.g. if (global.testRedisClient) await global.testRedisClient.quit();

		if (mongoContainer) await mongoContainer.stop();
		if (redisContainer) await redisContainer.stop();
		logger.info("Test containers stopped.");
	} catch (error) {
		logger.error("Failed to stop test containers:", error);
	}
}, TIMEOUT); // Increased timeout for afterAll
