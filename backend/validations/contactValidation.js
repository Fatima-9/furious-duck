const ApiError = require("../utils/apiError");
const { validateEmail, validateRequiredString } = require("./authValidation");

const ALLOWED_REASONS = [
  "Question sur le jeu",
  "Probleme avec un code",
  "Recuperation d'un lot",
  "Donnees personnelles",
  "Autre",
];

function validateContactPayload(body) {
  validateRequiredString(body.prenom, "prenom");
  validateRequiredString(body.nom, "nom");
  validateEmail(body.email);
  validateRequiredString(body.motif, "motif");
  validateRequiredString(body.message, "message");
  validateRequiredString(body.turnstile_token, "turnstile_token");

  const motif = body.motif.trim();

  if (!ALLOWED_REASONS.includes(motif)) {
    throw new ApiError(400, "motif is invalid");
  }

  if (body.message.trim().length < 10) {
    throw new ApiError(400, "message must contain at least 10 characters");
  }

  return {
    prenom: body.prenom.trim(),
    nom: body.nom.trim(),
    email: body.email.trim().toLowerCase(),
    motif,
    message: body.message.trim(),
    turnstile_token: body.turnstile_token.trim(),
  };
}

module.exports = {
  validateContactPayload,
  ALLOWED_REASONS,
};
