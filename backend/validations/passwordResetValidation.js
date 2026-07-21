const ApiError = require("../utils/apiError");

function validateRequiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }
}

function validateEmail(email) {
  validateRequiredString(email, "email");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new ApiError(400, "email must be valid");
  }
}

function getPassword(body) {
  return body.mot_de_passe || body.password;
}

function validateForgotPasswordPayload(body) {
  validateEmail(body.email);

  return {
    email: body.email.trim().toLowerCase(),
  };
}

function validateResetPasswordPayload(body) {
  validateRequiredString(body.token, "token");

  const password = getPassword(body);
  validateRequiredString(password, "mot_de_passe");

  if (password.length < 8) {
    throw new ApiError(400, "mot_de_passe must contain at least 8 characters");
  }

  return {
    token: body.token.trim(),
    mot_de_passe: password,
  };
}

module.exports = {
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
};
