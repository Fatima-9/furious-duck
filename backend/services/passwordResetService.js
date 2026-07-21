const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Utilisateur = require("../models/Utilisateur");
const ApiError = require("../utils/apiError");
const { SALT_ROUNDS } = require("./authService");

const TOKEN_EXPIRES_IN_MINUTES = Number(
  process.env.RESET_TOKEN_EXPIRES_IN_MINUTES || 60
);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function requestPasswordReset({ email }) {
  const user = await Utilisateur.findByEmail(email);

  // On ne dit jamais si l'email existe ou non : sinon n'importe qui pourrait
  // deviner quels comptes existent en testant des adresses une par une.
  if (!user || user.statut !== "actif") {
    return { resetToken: null };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

  await Utilisateur.update(user.id_user, {
    reset_token_hash: hashToken(resetToken),
    reset_token_expires: expires,
  });

  return { resetToken };
}

async function resetPassword({ token, mot_de_passe }) {
  const user = await Utilisateur.findByResetTokenHash(hashToken(token));

  if (!user) {
    throw new ApiError(400, "reset token is invalid or expired");
  }

  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    throw new ApiError(400, "reset token is invalid or expired");
  }

  const hashedPassword = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

  // Le token est effacé en même temps que le mot de passe change,
  // pour qu'il ne puisse pas servir une deuxième fois.
  await Utilisateur.update(user.id_user, {
    mot_de_passe: hashedPassword,
    reset_token_hash: null,
    reset_token_expires: null,
  });
}

module.exports = {
  requestPasswordReset,
  resetPassword,
};
