import ApiError from "./ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * @class NotFoundError
 * @extends {ApiError}
 * @description Represents a 404 Not Found error.
 */
class NotFoundError extends ApiError {
  /**
   * @param {string} [message='Not Found'] - Error message.
   * @param {string} [stack=''] - Error stack trace.
   */
  constructor(
    message = httpStatusCodes.getStatusText(httpStatusCodes.NOT_FOUND),
    stack = "",
  ) {
    super(httpStatusCodes.NOT_FOUND, message, true, stack);
  }
}

export default NotFoundError;
