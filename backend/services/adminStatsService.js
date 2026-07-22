const { pool } = require("../config/db");
const ApiError = require("../utils/apiError");

function ensureDatabaseConfigured() {
  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }
}

// PostgreSQL renvoie les count() en bigint, que le driver pg expose sous forme
// de chaine. On convertit systematiquement pour que l'API renvoie des nombres.
function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

async function getTicketStats() {
  ensureDatabaseConfigured();

  const result = await pool.query(`
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE utilisateur_id IS NOT NULL) AS utilises,
      count(*) FILTER (WHERE utilisateur_id IS NULL) AS restants,
      count(*) FILTER (WHERE remis) AS remis,
      count(*) FILTER (WHERE utilisateur_id IS NOT NULL AND NOT remis) AS a_remettre
    FROM tickets
  `);

  const row = result.rows[0];

  return {
    total: toCount(row.total),
    utilises: toCount(row.utilises),
    restants: toCount(row.restants),
    remis: toCount(row.remis),
    a_remettre: toCount(row.a_remettre),
  };
}

async function getGainStats() {
  ensureDatabaseConfigured();

  // LEFT JOIN pour garder les gains que personne n'a encore gagnes.
  const result = await pool.query(`
    SELECT
      g.id_gain,
      g.libelle,
      g.pourcentage_distribution,
      g.quantite_total,
      g.quantite_restante,
      count(t.id_ticket) FILTER (WHERE t.utilisateur_id IS NOT NULL) AS tickets_gagnes,
      count(t.id_ticket) FILTER (WHERE t.remis) AS lots_remis
    FROM gains g
    LEFT JOIN tickets t ON t.gain_id = g.id_gain
    GROUP BY
      g.id_gain,
      g.libelle,
      g.pourcentage_distribution,
      g.quantite_total,
      g.quantite_restante
    ORDER BY g.id_gain
  `);

  return result.rows.map((row) => ({
    id_gain: row.id_gain,
    libelle: row.libelle,
    pourcentage_distribution: Number(row.pourcentage_distribution),
    quantite_total: toCount(row.quantite_total),
    quantite_restante: toCount(row.quantite_restante),
    tickets_gagnes: toCount(row.tickets_gagnes),
    lots_remis: toCount(row.lots_remis),
  }));
}

async function getUserStats() {
  ensureDatabaseConfigured();

  const [global, parSexe, parTrancheAge, parInscription] = await Promise.all([
    pool.query(`
      SELECT
        count(DISTINCT u.id_user) AS total,
        count(DISTINCT u.id_user) FILTER (WHERE u.statut = 'actif') AS actifs,
        count(DISTINCT t.utilisateur_id) AS participants
      FROM utilisateurs u
      LEFT JOIN tickets t ON t.utilisateur_id = u.id_user
    `),
    pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(sexe), ''), 'non_renseigne') AS sexe,
        count(*) AS total
      FROM utilisateurs
      GROUP BY 1
      ORDER BY 1
    `),
    pool.query(`
      SELECT tranche, count(*) AS total
      FROM (
        SELECT CASE
          WHEN date_de_naissance IS NULL THEN 'non_renseigne'
          WHEN date_part('year', age(date_de_naissance)) < 18 THEN 'moins_de_18'
          WHEN date_part('year', age(date_de_naissance)) < 25 THEN '18_24'
          WHEN date_part('year', age(date_de_naissance)) < 35 THEN '25_34'
          WHEN date_part('year', age(date_de_naissance)) < 50 THEN '35_49'
          ELSE '50_et_plus'
        END AS tranche
        FROM utilisateurs
      ) AS tranches
      GROUP BY tranche
      ORDER BY tranche
    `),
    pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(type_inscription), ''), 'non_renseigne') AS type_inscription,
        count(*) AS total
      FROM utilisateurs
      GROUP BY 1
      ORDER BY 1
    `),
  ]);

  const globalRow = global.rows[0];

  return {
    total: toCount(globalRow.total),
    actifs: toCount(globalRow.actifs),
    participants: toCount(globalRow.participants),
    par_sexe: parSexe.rows.map((row) => ({
      sexe: row.sexe,
      total: toCount(row.total),
    })),
    par_tranche_age: parTrancheAge.rows.map((row) => ({
      tranche: row.tranche,
      total: toCount(row.total),
    })),
    par_type_inscription: parInscription.rows.map((row) => ({
      type_inscription: row.type_inscription,
      total: toCount(row.total),
    })),
  };
}

async function getOverview() {
  const [tickets, gains, utilisateurs] = await Promise.all([
    getTicketStats(),
    getGainStats(),
    getUserStats(),
  ]);

  return { tickets, gains, utilisateurs };
}

module.exports = {
  getTicketStats,
  getGainStats,
  getUserStats,
  getOverview,
  toCount,
};
