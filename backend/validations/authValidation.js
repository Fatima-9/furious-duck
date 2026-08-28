const ApiError = require("../utils/apiError");

function validateRequiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }
}

function validateEmail(email) {
  validateRequiredString(email, "email");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    throw new ApiError(400, "email must be valid");
  }
}

function getPassword(body) {
  return body.mot_de_passe || body.password;
}

function getTurnstileToken(body) {
  return body.turnstile_token || body.turnstileToken;
}

function validatePassword(password) {
  validateRequiredString(password, "mot_de_passe");

  if (password.length < 8) {
    throw new ApiError(400, "mot_de_passe must contain at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    throw new ApiError(400, "mot_de_passe must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    throw new ApiError(400, "mot_de_passe must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    throw new ApiError(400, "mot_de_passe must contain at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ApiError(400, "mot_de_passe must contain at least one special character");
  }
}

function validateRegisterPayload(body) {
  validateRequiredString(body.nom, "nom");
  validateRequiredString(body.prenom, "prenom");
  validateEmail(body.email);

  const password = getPassword(body);
  validatePassword(password);

  const turnstileToken = getTurnstileToken(body);
  validateRequiredString(turnstileToken, "turnstile_token");

  return {
    nom: body.nom.trim(),
    prenom: body.prenom.trim(),
    email: body.email.trim().toLowerCase(),
    mot_de_passe: password,
    date_de_naissance: body.date_de_naissance,
    sexe: body.sexe,
    type_inscription: body.type_inscription || "email",
    turnstile_token: turnstileToken.trim(),
  };
}

function validateLoginPayload(body) {
  validateEmail(body.email);

  const password = getPassword(body);
  validateRequiredString(password, "mot_de_passe");

  const turnstileToken = getTurnstileToken(body);
  validateRequiredString(turnstileToken, "turnstile_token");

  return {
    email: body.email.trim().toLowerCase(),
    mot_de_passe: password,
    turnstile_token: turnstileToken.trim(),
  };
}

function validateOAuthPayload(body) {
  validateRequiredString(body.provider, "provider");
  validateRequiredString(body.token, "token");

  const provider = body.provider.trim().toLowerCase();

  if (!["google", "facebook"].includes(provider)) {
    throw new ApiError(400, "provider must be google or facebook");
  }

  return {
    provider,
    token: body.token.trim(),
  };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateOAuthPayload,
  validateEmail,
  validatePassword,
  validateRequiredString,
};
