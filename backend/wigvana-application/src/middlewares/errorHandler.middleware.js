import mongoose from "mongoose";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";
import config from "../config/index.js";
import ApiError from "../errors/ApiError.js";

/**
 * @description Error handling middleware.
 * Converts errors to ApiError if necessary and sends a standardized JSON response.
 * @param {Error | ApiError} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
	let error = err;
	if (!(error instanceof ApiError)) {
		const statusCode =
			error.statusCode || error instanceof mongoose.Error
				? httpStatusCodes.BAD_REQUEST
				: httpStatusCodes.INTERNAL_SERVER_ERROR;
		const message = error.message || httpStatusCodes.getStatusText(statusCode);
		error = new ApiError(statusCode, message, false, err.stack);
	}

	const response = {
		code: error.statusCode,
		message: error.message,
		...(config.NODE_ENV === "development" && { stack: error.stack }),
	};

	if (config.NODE_ENV === "development") {
		logger.error(err);
	} else if (error.isOperational) {
		// For operational errors in production, log them too but perhaps less verbosely
		logger.error(err.message);
	} else {
		// For programming or unknown errors in production, log the full error
		logger.error(err);
	}

	res.status(error.statusCode).send(response);
};

export default errorHandler;
