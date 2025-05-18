import app from "./app.js";

import config from "./config/index.js";
import logger from "./utils/logger.js";

async function start() {
	app.listen(config.port, () => {
		logger.info("App starting.");
	});
}

start().catch((err) => {
	logger.error(err);
	process.exit(1);
});
