import ApiError from "./ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * @class ForbiddenError
 * @extends {ApiError}
 * @description Represents a 403 Forbidden error. The server understood the request, but is refusing to fulfill it. Authentication will not help.
 */
class ForbiddenError extends ApiError {
	/**
	 * @param {string} [message='Forbidden'] - Error message.
	 * @param {string} [stack=''] - Error stack trace.
	 */
	constructor(
		message = httpStatusCodes.getStatusText(httpStatusCodes.FORBIDDEN),
		stack = "",
	) {
		super(httpStatusCodes.FORBIDDEN, message, true, stack);
	}
}

export default ForbiddenError;
