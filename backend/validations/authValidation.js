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

function validatePassword(password) {
  validateRequiredString(password, "mot_de_passe");

  if (password.length < 8) {
    throw new ApiError(400, "mot_de_passe must contain at least 8 characters");
  }
}

function validateRegisterPayload(body) {
  validateRequiredString(body.nom, "nom");
  validateRequiredString(body.prenom, "prenom");
  validateEmail(body.email);

  const password = getPassword(body);
  validatePassword(password);

  if (!Number.isInteger(Number(body.role_id))) {
    throw new ApiError(400, "role_id is required");
  }

  if (!Number.isInteger(Number(body.boutique_id))) {
    throw new ApiError(400, "boutique_id is required");
  }

  return {
    nom: body.nom.trim(),
    prenom: body.prenom.trim(),
    email: body.email.trim().toLowerCase(),
    mot_de_passe: password,
    date_de_naissance: body.date_de_naissance,
    sexe: body.sexe,
    type_inscription: body.type_inscription || "email",
    role_id: Number(body.role_id),
    boutique_id: Number(body.boutique_id),
  };
}

function validateLoginPayload(body) {
  validateEmail(body.email);

  const password = getPassword(body);
  validateRequiredString(password, "mot_de_passe");

  return {
    email: body.email.trim().toLowerCase(),
    mot_de_passe: password,
  };
}

function validateOAuthPayload(body) {
  validateRequiredString(body.provider, "provider");
  validateRequiredString(body.token, "token");

  const provider = body.provider.trim().toLowerCase();

  if (!["google", "facebook"].includes(provider)) {
    throw new ApiError(400, "provider must be google or facebook");
  }

  const payload = {
    provider,
    token: body.token.trim(),
  };

  if (body.role_id !== undefined) {
    if (!Number.isInteger(Number(body.role_id))) {
      throw new ApiError(400, "role_id must be an integer");
    }

    payload.role_id = Number(body.role_id);
  }

  if (body.boutique_id !== undefined) {
    if (!Number.isInteger(Number(body.boutique_id))) {
      throw new ApiError(400, "boutique_id must be an integer");
    }

    payload.boutique_id = Number(body.boutique_id);
  }

  return payload;
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateOAuthPayload,
};
