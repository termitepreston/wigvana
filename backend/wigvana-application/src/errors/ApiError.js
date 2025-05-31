/**
 * @openapi
 * components:
 *    schemas:
 *      ErrorResponse:
 *        type: object
 *        properties:
 *          code:
 *            type: integer
 *            format: int32
 *            example: 404
 *          message:
 *            type: string
 *            example: "Request failed due to."
 *        required:
 *          - code
 *          - message
 *    responses:
 *      UnauthorizedError:
 *        description: Unauthorized resource access.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *      BadRequestError:
 *        description: Invalid request framing.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *      ForbiddenError:
 *        description: Forbidden access error.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *      NotFoundError:
 *        description: Resource not found error.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *      ConflictError:
 *        description: Conflict in resource state.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 */
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
