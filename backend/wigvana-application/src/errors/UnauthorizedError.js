import ApiError from "./ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * @class UnauthorizedError
 * @extends {ApiError}
 * @description Represents a 401 Unauthorized error. Typically used when authentication is required and has failed or has not yet been provided.
 */
class UnauthorizedError extends ApiError {
  /**
   * @param {string} [message='Unauthorized'] - Error message.
   * @param {string} [stack=''] - Error stack trace.
   */
  constructor(
    message = httpStatusCodes.getStatusText(httpStatusCodes.UNAUTHORIZED),
    stack = "",
  ) {
    super(httpStatusCodes.UNAUTHORIZED, message, true, stack);
  }
}

export default UnauthorizedError;
