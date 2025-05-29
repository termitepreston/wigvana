// vitest.config.e2e.js
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["test/e2e/admin.user.e2e.test.js"], // Only run e2e tests
		setupFiles: ["./test/setup/e2eSetup.js"], // Global setup for E2E
		testTimeout: 10 * 60 * 1000, // Increase timeout for E2E tests (container startup)
		hookTimeout: 10 * 60 * 1000, // Increase timeout for hooks
	},
});
