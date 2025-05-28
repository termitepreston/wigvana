import Redis from "ioredis";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const redis = new Redis(config.redis.url);

redis.on("connect", () => logger.info("Connected to redis."));
redis.on("error", (err) => logger.error(`Redis error: ${err.message}`));

export default redis;
