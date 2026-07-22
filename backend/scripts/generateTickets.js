require("dotenv").config();

const { pool } = require("../config/db");
const { DEFAULT_TICKET_COUNT } = require("../config/prizes");
const { generateCampaignTickets } = require("../services/ticketService");

function getArg(name, defaultValue) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  if (!arg) {
    return defaultValue;
  }

  return arg.slice(prefix.length);
}

async function main() {
  const totalTickets = Number(getArg("total", DEFAULT_TICKET_COUNT));
  const campaignName = getArg("name", "The Tip Top - Jeu concours");
  const dateDebut = getArg("start", undefined);
  const dateFin = getArg("end", undefined);
  const dateFinReclamation = getArg("claim-end", undefined);

  const result = await generateCampaignTickets({
    totalTickets,
    campaignName,
    dateDebut,
    dateFin,
    dateFinReclamation,
  });

  console.log(
    JSON.stringify(
      {
        status: "success",
        campaignId: result.campaign.id_campagne,
        totalTickets: result.totalTickets,
        prizes: result.prizes.map((prize) => ({
          id_gain: prize.id_gain,
          libelle: prize.libelle,
          quantite_total: prize.quantite_total,
        })),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (pool) {
      await pool.end();
    }
  });
