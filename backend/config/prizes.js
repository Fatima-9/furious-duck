const PRIZE_DISTRIBUTION = [
  {
    key: "infuseur",
    libelle: "Infuseur a the",
    pourcentage_distribution: 60,
  },
  {
    key: "the_detox_infusion",
    libelle: "Boite de 100g de the detox ou infusion",
    pourcentage_distribution: 20,
  },
  {
    key: "the_signature",
    libelle: "Boite de 100g de the signature",
    pourcentage_distribution: 10,
  },
  {
    key: "coffret_39",
    libelle: "Coffret decouverte 39 euros",
    pourcentage_distribution: 6,
  },
  {
    key: "coffret_69",
    libelle: "Coffret decouverte 69 euros",
    pourcentage_distribution: 4,
  },
];

const DEFAULT_TICKET_COUNT = 500000;

function getPrizeQuantities(totalTickets = DEFAULT_TICKET_COUNT) {
  const quantities = PRIZE_DISTRIBUTION.map((prize) => ({
    ...prize,
    quantite_total: Math.floor(
      (totalTickets * prize.pourcentage_distribution) / 100
    ),
  }));

  const assigned = quantities.reduce((sum, prize) => sum + prize.quantite_total, 0);
  quantities[0].quantite_total += totalTickets - assigned;

  return quantities.map((prize) => ({
    ...prize,
    quantite_restante: prize.quantite_total,
  }));
}

module.exports = {
  DEFAULT_TICKET_COUNT,
  PRIZE_DISTRIBUTION,
  getPrizeQuantities,
};
