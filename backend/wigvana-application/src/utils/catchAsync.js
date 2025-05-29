/**
 * @description Wraps an async function to catch any errors and pass them to the next middleware.
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} A new function that handles promise rejections.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

export default catchAsync;
