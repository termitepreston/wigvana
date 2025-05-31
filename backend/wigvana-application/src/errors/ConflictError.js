import ApiError from "./ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * @class ConflictError
 * @extends {ApiError}
 * @description Represents a 409 Conflict error.
 */
class ConflictError extends ApiError {
	/**
	 * @param {string} message Error message
	 * @param {string} [stack=''] Error stack trace
	 */
	constructor(message, stack = "") {
		super(httpStatusCodes.CONFLICT, message, true, stack);
	}
}

export default ConflictError;
