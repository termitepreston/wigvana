import ApiError from "./ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * @class BadRequestError
 * @extends {ApiError}
 * @description Represents a 400 Bad Request error.
 */
class BadRequestError extends ApiError {
  /**
   * @param {string} message Error message
   * @param {string} [stack=''] Error stack trace
   */
  constructor(message, stack = "") {
    super(httpStatusCodes.BAD_REQUEST, message, true, stack);
  }
}

export default BadRequestError;
