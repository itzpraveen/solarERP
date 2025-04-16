/**
 * Async error handling utility for controllers
 * This utility wraps async controller functions to catch errors and pass them to the error handler
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
