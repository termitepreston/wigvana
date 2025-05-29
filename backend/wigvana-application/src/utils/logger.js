import pino from "pino";
import config from "../config/index.js";

const logger = pino({
	level: config.LOG_LEVEL,
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:standard", // More readable timestamp
			ignore: "pid,hostname", // Ignore pid and hostname
		},
	},
});

export default logger;
