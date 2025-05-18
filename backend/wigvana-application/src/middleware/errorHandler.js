import config from "../config/index.js";

export default function (err, req, res, next) {
	console.err("Unhandled error: ", err);

	const status = err.status || 500;
	const message = err.message || "Internal server error.";

	res.status(status).json({
		success: false,
		error: {
			message,
			...(config.env === "development" && { stack: err.stack }),
		},
	});
}
