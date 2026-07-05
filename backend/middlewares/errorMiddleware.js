function errorMiddleware(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message;

  if (error.code === "23505") {
    statusCode = 409;
    message = "resource already exists";
  }

  if (error.code === "23503") {
    statusCode = 400;
    message = "invalid related resource";
  }

  return res.status(statusCode).json({
    status: "error",
    message: statusCode === 500 ? "Internal server error" : message,
  });
}

module.exports = errorMiddleware;
