import dotenv from "dotenv";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envVarsSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  GRAPHDB_URL: z.string().url().optional(),
  GRAPHDB_REPOSITORY: z.string().optional(),
  JWT_SECRET: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRATION_MINUTES: z.coerce.number().default(15),
  JWT_REFRESH_TOKEN_EXPIRATION_DAYS: z.coerce.number().default(7),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.string().default("info"),
});

/**
 * @type {ReturnType<envVarsSchema.parse>}
 */
let envConfig;

try {
  envConfig = envVarsSchema.parse(process.env);
} catch (error) {
  // Log the detailed error if validation fails
  console.error("Environment variable validation failed:", error.errors);
  process.exit(1); // Exit if critical env vars are missing/invalid
}

export default envConfig;
