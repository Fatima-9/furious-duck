const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const Utilisateur = require("../models/Utilisateur");
const ApiError = require("../utils/apiError");
const { sanitizeUser } = require("../utils/userPresenter");
const { SALT_ROUNDS } = require("./authService");
const emailService = require("./emailService");

async function getProfile(userId) {
  const user = await Utilisateur.findById(userId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, updates) {
  if (updates.email) {
    const existingUser = await Utilisateur.findByEmail(updates.email);

    // findByEmail peut retrouver l'utilisateur courant s'il renvoie le meme
    // email qu'avant : dans ce cas ce n'est pas un doublon.
    if (existingUser && existingUser.id_user !== userId) {
      throw new ApiError(409, "email is already used");
    }
  }

  const user = await Utilisateur.update(userId, updates);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  return sanitizeUser(user);
}

async function changePassword(userId, { mot_de_passe_actuel, mot_de_passe }) {
  const user = await Utilisateur.findById(userId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  // On revalide le mot de passe actuel : un token vole ne doit pas suffire
  // pour changer le mot de passe et prendre le controle du compte.
  const passwordMatches = await bcrypt.compare(
    mot_de_passe_actuel,
    user.mot_de_passe
  );

  if (!passwordMatches) {
    throw new ApiError(401, "current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

  await Utilisateur.update(userId, { mot_de_passe: hashedPassword });

  // Confirmation par email (best-effort : ne bloque pas le changement).
  try {
    await emailService.sendPasswordChangedEmail(user.email);
  } catch (error) {
    console.error("[email] envoi impossible:", error.message);
  }
}

async function deleteProfile(userId) {
  const user = await Utilisateur.findById(userId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (Number(user.role_id) === Number(process.env.ADMIN_ROLE_ID || 2)) {
    throw new ApiError(403, "admin account cannot be deleted");
  }

  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE tickets
        SET
          utilisateur_id = CASE WHEN utilisateur_id = $1 THEN NULL ELSE utilisateur_id END,
          remis_par = CASE WHEN remis_par = $1 THEN NULL ELSE remis_par END
        WHERE utilisateur_id = $1 OR remis_par = $1
      `,
      [userId]
    );

    const deleted = await client.query(
      "DELETE FROM utilisateurs WHERE id_user = $1 RETURNING *",
      [userId]
    );

    if (!deleted.rows[0]) {
      throw new ApiError(404, "user not found");
    }

    await client.query("COMMIT");

    return sanitizeUser(deleted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
};
