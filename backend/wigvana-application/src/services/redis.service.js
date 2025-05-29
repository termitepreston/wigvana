import Redis from "ioredis";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const redisClient = new Redis(config.REDIS_URL, {
  // ioredis will automatically try to reconnect
  // You can add more options here if needed, like TLS
  maxRetriesPerRequest: 3, // Example: retry commands up to 3 times
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
  logger.error("Redis connection error:", err);
  // Depending on your strategy, you might want to exit the app
  // or implement a circuit breaker pattern for Redis-dependent features.
});

/**
 * Sets a value in Redis.
 * @param {string} key The key to set.
 * @param {string | number | Buffer} value The value to set.
 * @param {number} [ttlSeconds] Time to live in seconds.
 * @returns {Promise<string | null>} A promise that resolves with 'OK' or null.
 */
const set = async (key, value, ttlSeconds) => {
  try {
    if (ttlSeconds) {
      return await redisClient.set(key, value, "EX", ttlSeconds);
    }
    return await redisClient.set(key, value);
  } catch (error) {
    logger.error(`Error setting Redis key ${key}:`, error);
    return null; // Or throw, depending on how critical Redis is
  }
};

/**
 * Gets a value from Redis.
 * @param {string} key The key to get.
 * @returns {Promise<string | null>} A promise that resolves with the value or null if not found or error.
 */
const get = async (key) => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error(`Error getting Redis key ${key}:`, error);
    return null;
  }
};

/**
 * Deletes a key from Redis.
 * @param {string} key The key to delete.
 * @returns {Promise<number>} A promise that resolves with the number of keys deleted (0 or 1).
 */
const del = async (key) => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    logger.error(`Error deleting Redis key ${key}:`, error);
    return 0;
  }
};

export const redisService = {
  client: redisClient, // Export client for direct use if needed
  set,
  get,
  del,
};
