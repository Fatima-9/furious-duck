const { pool } = require("../config/db");
const ApiError = require("../utils/apiError");

function ensureDatabaseConfigured() {
  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }
}

// Colonnes de l'export emailing. Principe RGPD de minimisation : on ne sort que
// ce qui sert reellement a contacter et segmenter, rien de plus.
// Jamais de mot de passe, de token de reset ni d'identifiant OAuth.
const EMAILING_COLUMNS = [
  "id_user",
  "nom",
  "prenom",
  "email",
  "date_inscription",
  "type_inscription",
  "statut",
  "nb_participations",
];

async function getEmailingExport() {
  ensureDatabaseConfigured();

  const result = await pool.query(`
    SELECT
      u.id_user,
      u.nom,
      u.prenom,
      u.email,
      u.date_inscription,
      COALESCE(NULLIF(TRIM(u.type_inscription), ''), 'non_renseigne') AS type_inscription,
      u.statut,
      count(t.id_ticket) AS nb_participations
    FROM utilisateurs u
    LEFT JOIN tickets t ON t.utilisateur_id = u.id_user
    GROUP BY u.id_user, u.nom, u.prenom, u.email, u.date_inscription, u.type_inscription, u.statut
    ORDER BY u.id_user
  `);

  return result.rows.map((row) => ({
    ...row,
    nb_participations: Number(row.nb_participations),
  }));
}

// Droit a la portabilite (RGPD art. 20) : l'utilisateur recupere ses propres
// donnees. On exclut les elements d'authentification, qui sont des secrets
// techniques et non des donnees personnelles exploitables.
async function getUserPersonalExport(userId) {
  ensureDatabaseConfigured();

  const profil = await pool.query(
    `
      SELECT
        id_user,
        nom,
        prenom,
        email,
        date_de_naissance,
        sexe,
        type_inscription,
        date_inscription,
        statut,
        role_id,
        boutique_id
      FROM utilisateurs
      WHERE id_user = $1
    `,
    [userId]
  );

  if (!profil.rows[0]) {
    throw new ApiError(404, "user not found");
  }

  const participations = await pool.query(
    `
      SELECT
        t.code_ticket,
        t.date_utilisation,
        t.remis,
        t.date_remise,
        g.libelle AS gain,
        c.nom AS campagne
      FROM tickets t
      JOIN gains g ON g.id_gain = t.gain_id
      JOIN campagnes c ON c.id_campagne = t.campagne_id
      WHERE t.utilisateur_id = $1
      ORDER BY t.date_utilisation DESC, t.id_ticket DESC
    `,
    [userId]
  );

  return {
    genere_le: new Date().toISOString(),
    profil: profil.rows[0],
    participations: participations.rows,
  };
}

module.exports = {
  getEmailingExport,
  getUserPersonalExport,
  EMAILING_COLUMNS,
};
