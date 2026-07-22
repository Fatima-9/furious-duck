const BaseModel = require("./BaseModel");
const { pool } = require("../config/db");

const Utilisateur = new BaseModel({
  tableName: "utilisateurs",
  primaryKey: "id_user",
  columns: [
    "nom",
    "prenom",
    "email",
    "mot_de_passe",
    "date_de_naissance",
    "sexe",
    "type_inscription",
    "date_inscription",
    "statut",
    "role_id",
    "boutique_id",
    "oauth_provider",
    "oauth_subject",
    "reset_token_hash",
    "reset_token_expires",
  ],
});

Utilisateur.findByEmail = async (email) => {
  Utilisateur.ensureDatabaseConfigured();

  const result = await pool.query("SELECT * FROM utilisateurs WHERE email = $1", [
    email,
  ]);

  return result.rows[0] || null;
};

Utilisateur.findByResetTokenHash = async (tokenHash) => {
  Utilisateur.ensureDatabaseConfigured();

  const result = await pool.query(
    "SELECT * FROM utilisateurs WHERE reset_token_hash = $1",
    [tokenHash]
  );

  return result.rows[0] || null;
};

Utilisateur.findByOAuthIdentity = async (provider, subject) => {
  Utilisateur.ensureDatabaseConfigured();

  const result = await pool.query(
    "SELECT * FROM utilisateurs WHERE oauth_provider = $1 AND oauth_subject = $2",
    [provider, subject]
  );

  return result.rows[0] || null;
};

module.exports = Utilisateur;
