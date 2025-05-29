import mongoose from "mongoose";
import app from "./app.js";
import config from "./config/index.js";
import logger from "./utils/logger.js";
import { redisService } from "./services/redis.service.js"; // To ensure Redis connects

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      // useNewUrlParser: true, // no longer needed
      // useUnifiedTopology: true, // no longer needed
      // useCreateIndex: true, // no longer supported
      // useFindAndModify: false // no longer supported
    });
    logger.info("MongoDB Connected...");

    // Test Redis connection by trying to ping or set a test key
    await redisService.client.ping(); // Will throw if not connected
    logger.info("Redis connection successful (ping successful).");
  } catch (err) {
    logger.error("Database or Redis connection error:", err.message);
    // Exit process with failure
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    logger.info(
      `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`,
    );
    logger.info(
      `API docs available at http://localhost:${config.PORT}/api-docs`,
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM (e.g., from Docker or PaaS)
  process.on("SIGTERM", () => {
    logger.info("SIGTERM RECEIVED. Shutting down gracefully...");
    server.close(() => {
      logger.info("Process terminated!");
      mongoose.connection.close(false, () => {
        logger.info("MongoDB connection closed.");
        redisService.client.quit(() => {
          logger.info("Redis connection closed.");
          process.exit(0);
        });
      });
    });
  });
  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => {
    logger.info("SIGINT RECEIVED. Shutting down gracefully...");
    server.close(() => {
      logger.info("Process terminated!");
      mongoose.connection.close(false, () => {
        logger.info("MongoDB connection closed.");
        redisService.client.quit(() => {
          logger.info("Redis connection closed.");
          process.exit(0);
        });
      });
    });
  });
};

startServer();
