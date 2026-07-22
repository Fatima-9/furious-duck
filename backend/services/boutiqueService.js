const { pool } = require("../config/db");
const ApiError = require("../utils/apiError");

function ensureDatabaseConfigured() {
  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }
}

const GAIN_SELECT = `
  SELECT
    t.id_ticket,
    t.code_ticket,
    t.statut,
    t.date_utilisation,
    t.remis,
    t.date_remise,
    t.remis_par,
    g.id_gain,
    g.libelle AS gain_libelle,
    u.id_user,
    u.nom AS user_nom,
    u.prenom AS user_prenom,
    u.email AS user_email,
    c.id_campagne,
    c.nom AS campagne_nom,
    c.date_fin_reclamation
  FROM tickets t
  JOIN gains g ON g.id_gain = t.gain_id
  JOIN campagnes c ON c.id_campagne = t.campagne_id
  LEFT JOIN utilisateurs u ON u.id_user = t.utilisateur_id
`;

function isClaimPeriodOver(dateFinReclamation) {
  if (!dateFinReclamation) {
    return false;
  }

  return new Date() > new Date(dateFinReclamation);
}

function toGainView(row) {
  if (!row) {
    return null;
  }

  return {
    id_ticket: row.id_ticket,
    code_ticket: row.code_ticket,
    statut: row.statut,
    date_utilisation: row.date_utilisation,
    remis: row.remis,
    date_remise: row.date_remise,
    remis_par: row.remis_par,
    // Un employe doit voir d'un coup d'oeil s'il peut remettre le lot.
    peut_etre_remis:
      Boolean(row.id_user) &&
      !row.remis &&
      !isClaimPeriodOver(row.date_fin_reclamation),
    gain: {
      id_gain: row.id_gain,
      libelle: row.gain_libelle,
    },
    gagnant: row.id_user
      ? {
          id_user: row.id_user,
          nom: row.user_nom,
          prenom: row.user_prenom,
          email: row.user_email,
        }
      : null,
    campagne: {
      id_campagne: row.id_campagne,
      nom: row.campagne_nom,
      date_fin_reclamation: row.date_fin_reclamation,
    },
  };
}

async function findGainByTicketCode(codeTicket) {
  ensureDatabaseConfigured();

  const result = await pool.query(
    `${GAIN_SELECT} WHERE t.code_ticket = $1`,
    [codeTicket]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "ticket not found");
  }

  return toGainView(result.rows[0]);
}

async function findGainsByWinner(criteria) {
  ensureDatabaseConfigured();

  // On ne renvoie que les tickets reellement joues : un employe cherche un
  // gagnant, pas les 500 000 tickets encore en circulation.
  const filters = {
    id: "u.id_user = $1",
    email: "u.email = $1",
    nom: "(u.nom ILIKE $1 OR u.prenom ILIKE $1)",
  };

  const value = criteria.type === "nom" ? `%${criteria.value}%` : criteria.value;

  const result = await pool.query(
    `
      ${GAIN_SELECT}
      WHERE t.utilisateur_id IS NOT NULL AND ${filters[criteria.type]}
      ORDER BY t.date_utilisation DESC, t.id_ticket DESC
    `,
    [value]
  );

  return result.rows.map(toGainView);
}

async function markTicketAsRemis(codeTicket, employeId) {
  ensureDatabaseConfigured();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // FOR UPDATE : si deux employes remettent le meme lot en meme temps,
    // le second attend et verra que le lot est deja remis.
    const result = await client.query(
      `${GAIN_SELECT} WHERE t.code_ticket = $1 FOR UPDATE OF t`,
      [codeTicket]
    );
    const row = result.rows[0];

    if (!row) {
      throw new ApiError(404, "ticket not found");
    }

    if (!row.id_user) {
      throw new ApiError(409, "ticket has not been used yet");
    }

    if (row.remis) {
      throw new ApiError(409, "prize has already been delivered");
    }

    if (isClaimPeriodOver(row.date_fin_reclamation)) {
      throw new ApiError(409, "claim period is over");
    }

    const updated = await client.query(
      `
        UPDATE tickets
        SET remis = true,
            date_remise = CURRENT_TIMESTAMP,
            remis_par = $1
        WHERE id_ticket = $2
        RETURNING remis, date_remise, remis_par
      `,
      [employeId, row.id_ticket]
    );

    await client.query("COMMIT");

    return toGainView({ ...row, ...updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findGainByTicketCode,
  findGainsByWinner,
  markTicketAsRemis,
  toGainView,
  isClaimPeriodOver,
};
