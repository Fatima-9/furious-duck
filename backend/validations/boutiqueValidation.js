const ApiError = require("../utils/apiError");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_SEARCH_LENGTH = 2;

// Recherche d'un gagnant : soit par identifiant, soit par email, soit par nom.
// On exige un critere et un seul, pour eviter les recherches ambigues.
function validateWinnerSearch(query) {
  const utilisateurId = query.utilisateur_id;
  const email = query.email;
  const recherche = query.recherche;

  const provided = [utilisateurId, email, recherche].filter(
    (value) => value !== undefined && String(value).trim() !== ""
  );

  if (provided.length === 0) {
    throw new ApiError(
      400,
      "one search criteria is required: utilisateur_id, email or recherche"
    );
  }

  if (provided.length > 1) {
    throw new ApiError(400, "only one search criteria is allowed at a time");
  }

  if (utilisateurId !== undefined && String(utilisateurId).trim() !== "") {
    const id = Number(utilisateurId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, "utilisateur_id must be a positive integer");
    }

    return { type: "id", value: id };
  }

  if (email !== undefined && String(email).trim() !== "") {
    const normalized = String(email).trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ApiError(400, "email must be valid");
    }

    return { type: "email", value: normalized };
  }

  const normalized = String(recherche).trim();

  if (normalized.length < MIN_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `recherche must contain at least ${MIN_SEARCH_LENGTH} characters`
    );
  }

  return { type: "nom", value: normalized };
}

module.exports = {
  validateWinnerSearch,
};
