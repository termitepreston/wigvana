/**
 * @class ApiError
 * @extends {Error}
 * @description Base class for API errors, includes HTTP status code.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Error message
   * @param {boolean} [isOperational=true] Indicates if it's an operational error (vs. programming error)
   * @param {string} [stack=''] Error stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
