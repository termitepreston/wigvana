// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node", // or 'jsdom' if you test frontend components
		// setupFiles: ['./test/setup/setupFile.js'], // Optional setup file
		coverage: {
			provider: "v8", // or 'istanbul'
			reporter: ["text", "json", "html"],
		},
	},
});
