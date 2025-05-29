import { z } from "zod";
import httpStatusCodes from "http-status-codes";

/**
 * @description Middleware to validate request data (body, query, params) against a Zod schema.
 * @param {z.AnyZodObject} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies, // Added cookies validation
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors for a more user-friendly response
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }
    // Forward other errors
    next(error);
  }
};

export default validate;
