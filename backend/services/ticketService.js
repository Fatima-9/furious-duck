const crypto = require("crypto");
const { pool } = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  DEFAULT_TICKET_COUNT,
  getPrizeQuantities,
} = require("../config/prizes");

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;
const INSERT_BATCH_SIZE = 5000;

function ensureDatabaseConfigured() {
  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }
}

function toPublicTicket(row) {
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
    gain: {
      id_gain: row.id_gain,
      libelle: row.gain_libelle || row.libelle,
    },
    campagne: {
      id_campagne: row.id_campagne,
      nom: row.campagne_nom,
    },
  };
}

function getParticipationState(row) {
  if (!row) {
    return {
      exists: false,
      canParticipate: false,
      reason: "not_found",
    };
  }

  if (row.date_utilisation || row.utilisateur_id || row.statut !== "actif") {
    return {
      exists: true,
      canParticipate: false,
      reason: "already_used",
    };
  }

  const now = new Date();
  const start = row.date_debut ? new Date(row.date_debut) : null;
  const claimEnd = row.date_fin_reclamation
    ? new Date(row.date_fin_reclamation)
    : row.date_fin
      ? new Date(row.date_fin)
      : null;

  if (start && now < start) {
    return {
      exists: true,
      canParticipate: false,
      reason: "campaign_not_started",
    };
  }

  if (claimEnd && now > claimEnd) {
    return {
      exists: true,
      canParticipate: false,
      reason: "campaign_finished",
    };
  }

  if (row.campagne_statut && row.campagne_statut !== "actif") {
    return {
      exists: true,
      canParticipate: false,
      reason: "campaign_inactive",
    };
  }

  return {
    exists: true,
    canParticipate: true,
    reason: null,
  };
}

async function findTicketWithContext(client, codeTicket, lock = false) {
  const result = await client.query(
    `
      SELECT
        t.*,
        g.id_gain,
        g.libelle AS gain_libelle,
        c.id_campagne,
        c.nom AS campagne_nom,
        c.date_debut,
        c.date_fin,
        c.date_fin_reclamation,
        c.statut AS campagne_statut
      FROM tickets t
      JOIN gains g ON g.id_gain = t.gain_id
      JOIN campagnes c ON c.id_campagne = t.campagne_id
      WHERE t.code_ticket = $1
      ${lock ? "FOR UPDATE OF t" : ""}
    `,
    [codeTicket]
  );

  return result.rows[0] || null;
}

async function verifyTicket(codeTicket) {
  ensureDatabaseConfigured();

  const row = await findTicketWithContext(pool, codeTicket);
  const state = getParticipationState(row);

  return {
    code_ticket: codeTicket,
    exists: state.exists,
    canParticipate: state.canParticipate,
    reason: state.reason,
  };
}

async function participateWithTicket(userId, codeTicket) {
  ensureDatabaseConfigured();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const row = await findTicketWithContext(client, codeTicket, true);
    const state = getParticipationState(row);

    if (!state.exists) {
      throw new ApiError(404, "ticket not found");
    }

    if (!state.canParticipate) {
      throw new ApiError(409, `ticket cannot be used: ${state.reason}`);
    }

    const updateResult = await client.query(
      `
        UPDATE tickets
        SET utilisateur_id = $1,
            date_utilisation = CURRENT_TIMESTAMP,
            statut = 'utilise'
        WHERE id_ticket = $2
        RETURNING *
      `,
      [userId, row.id_ticket]
    );

    await client.query(
      `
        UPDATE gains
        SET quantite_restante = GREATEST(quantite_restante - 1, 0)
        WHERE id_gain = $1
      `,
      [row.gain_id]
    );

    await client.query("COMMIT");

    return toPublicTicket({
      ...row,
      ...updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserGainHistory(userId) {
  ensureDatabaseConfigured();

  const result = await pool.query(
    `
      SELECT
        t.*,
        g.id_gain,
        g.libelle AS gain_libelle,
        c.id_campagne,
        c.nom AS campagne_nom
      FROM tickets t
      JOIN gains g ON g.id_gain = t.gain_id
      JOIN campagnes c ON c.id_campagne = t.campagne_id
      WHERE t.utilisateur_id = $1
      ORDER BY t.date_utilisation DESC, t.id_ticket DESC
    `,
    [userId]
  );

  return result.rows.map(toPublicTicket);
}

function generateTicketCode() {
  let code = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }

  return code;
}

function buildTicketCodes(count, existingCodes = new Set()) {
  const codes = [];

  while (codes.length < count) {
    const code = generateTicketCode();

    if (!existingCodes.has(code)) {
      existingCodes.add(code);
      codes.push(code);
    }
  }

  return codes;
}

async function insertTicketsForGain(client, { gainId, campagneId, quantity }, usedCodes) {
  let inserted = 0;

  while (inserted < quantity) {
    const batchSize = Math.min(INSERT_BATCH_SIZE, quantity - inserted);
    const codes = buildTicketCodes(batchSize, usedCodes);
    const values = [];
    const placeholders = codes.map((code, index) => {
      const offset = index * 3;
      values.push(code, gainId, campagneId);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    });

    await client.query(
      `
        INSERT INTO tickets (code_ticket, gain_id, campagne_id)
        VALUES ${placeholders.join(", ")}
      `,
      values
    );

    inserted += batchSize;
  }
}

async function generateCampaignTickets({
  totalTickets = DEFAULT_TICKET_COUNT,
  campaignName = "The Tip Top - Jeu concours",
  dateDebut = new Date(),
  dateFin,
  dateFinReclamation,
} = {}) {
  ensureDatabaseConfigured();

  const total = Number(totalTickets);

  if (!Number.isInteger(total) || total <= 0) {
    throw new ApiError(400, "totalTickets must be a positive integer");
  }

  const startDate = new Date(dateDebut);
  const endDate =
    dateFin !== undefined
      ? new Date(dateFin)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const claimEndDate =
    dateFinReclamation !== undefined
      ? new Date(dateFinReclamation)
      : new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    Number.isNaN(claimEndDate.getTime())
  ) {
    throw new ApiError(400, "campaign dates must be valid");
  }

  const prizes = getPrizeQuantities(total);
  const usedCodes = new Set();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const campaignResult = await client.query(
      `
        INSERT INTO campagnes (
          nom,
          date_debut,
          date_fin,
          date_fin_reclamation,
          nombre_tickets_max
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [campaignName, startDate, endDate, claimEndDate, total]
    );
    const campaign = campaignResult.rows[0];

    const createdPrizes = [];

    for (const prize of prizes) {
      const gainResult = await client.query(
        `
          INSERT INTO gains (
            libelle,
            pourcentage_distribution,
            quantite_total,
            quantite_restante
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [
          prize.libelle,
          prize.pourcentage_distribution,
          prize.quantite_total,
          prize.quantite_restante,
        ]
      );

      const gain = gainResult.rows[0];
      createdPrizes.push(gain);
      await insertTicketsForGain(
        client,
        {
          gainId: gain.id_gain,
          campagneId: campaign.id_campagne,
          quantity: prize.quantite_total,
        },
        usedCodes
      );
    }

    await client.query("COMMIT");

    return {
      campaign,
      prizes: createdPrizes,
      totalTickets: total,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  verifyTicket,
  participateWithTicket,
  getUserGainHistory,
  toPublicTicket,
  getParticipationState,
  generateTicketCode,
  buildTicketCodes,
  generateCampaignTickets,
};
