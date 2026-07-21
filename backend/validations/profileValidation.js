const ApiError = require("../utils/apiError");

// Seuls ces champs sont modifiables par l'utilisateur lui-meme.
// role_id, boutique_id et statut en sont volontairement absents.
const EDITABLE_FIELDS = [
  "nom",
  "prenom",
  "email",
  "date_de_naissance",
  "sexe",
];

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

function validateUpdateProfilePayload(body) {
  const rejected = Object.keys(body).filter(
    (field) => !EDITABLE_FIELDS.includes(field)
  );

  if (rejected.length > 0) {
    throw new ApiError(400, `these fields cannot be updated: ${rejected.join(", ")}`);
  }

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

  if (body.date_de_naissance !== undefined) {
    const date = new Date(body.date_de_naissance);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(400, "date_de_naissance must be a valid date");
    }

    updates.date_de_naissance = body.date_de_naissance;
  }

  if (body.sexe !== undefined) {
    validateRequiredString(body.sexe, "sexe");
    updates.sexe = body.sexe.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "no field to update");
  }

  return updates;
}

function validateChangePasswordPayload(body) {
  validateRequiredString(body.mot_de_passe_actuel, "mot_de_passe_actuel");

  const newPassword = getPassword(body);
  validateRequiredString(newPassword, "mot_de_passe");

  if (newPassword.length < 8) {
    throw new ApiError(400, "mot_de_passe must contain at least 8 characters");
  }

  if (newPassword === body.mot_de_passe_actuel) {
    throw new ApiError(400, "new password must be different from the current one");
  }

  return {
    mot_de_passe_actuel: body.mot_de_passe_actuel,
    mot_de_passe: newPassword,
  };
}

module.exports = {
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
};
