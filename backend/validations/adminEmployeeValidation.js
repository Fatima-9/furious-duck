const ApiError = require("../utils/apiError");
const {
  validateEmail,
  validatePassword,
  validateRequiredString,
} = require("./authValidation");

const ALLOWED_STATUSES = ["actif", "inactif"];

function normalizeBoutiqueId(value) {
  const boutiqueId = Number(value);

  if (!Number.isInteger(boutiqueId) || boutiqueId < 1) {
    throw new ApiError(400, "boutique_id must be a positive integer");
  }

  return boutiqueId;
}

function normalizeStatus(value, fallback = "actif") {
  const statut = value === undefined ? fallback : String(value).trim();

  if (!ALLOWED_STATUSES.includes(statut)) {
    throw new ApiError(400, "statut must be actif or inactif");
  }

  return statut;
}

function validateCreateEmployeePayload(body) {
  validateRequiredString(body.nom, "nom");
  validateRequiredString(body.prenom, "prenom");
  validateEmail(body.email);
  validatePassword(body.mot_de_passe || body.password);

  return {
    nom: body.nom.trim(),
    prenom: body.prenom.trim(),
    email: body.email.trim().toLowerCase(),
    mot_de_passe: body.mot_de_passe || body.password,
    boutique_id: normalizeBoutiqueId(body.boutique_id),
    statut: normalizeStatus(body.statut, "actif"),
  };
}

function validateUpdateEmployeePayload(body) {
  const updates = {};

  if (body.nom !== undefined) {
    validateRequiredString(body.nom, "nom");
    updates.nom = body.nom.trim();
  }

  if (body.prenom !== undefined) {
    validateRequiredString(body.prenom, "prenom");
    updates.prenom = body.prenom.trim();
  }

  if (body.email !== undefined) {
    validateEmail(body.email);
    updates.email = body.email.trim().toLowerCase();
  }

  if (body.mot_de_passe !== undefined || body.password !== undefined) {
    const password = body.mot_de_passe || body.password;
    validatePassword(password);
    updates.mot_de_passe = password;
  }

  if (body.boutique_id !== undefined) {
    updates.boutique_id = normalizeBoutiqueId(body.boutique_id);
  }

  if (body.statut !== undefined) {
    updates.statut = normalizeStatus(body.statut);
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "at least one field must be provided");
  }

  return updates;
}

module.exports = {
  validateCreateEmployeePayload,
  validateUpdateEmployeePayload,
};
