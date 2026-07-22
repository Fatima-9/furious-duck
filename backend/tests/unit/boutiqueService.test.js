jest.mock("../../config/db", () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const boutiqueService = require("../../services/boutiqueService");

const HIER = new Date(Date.now() - 24 * 60 * 60 * 1000);
const DEMAIN = new Date(Date.now() + 24 * 60 * 60 * 1000);

function buildRow(overrides = {}) {
  return {
    id_ticket: 1,
    code_ticket: "ABCDEFGH12",
    statut: "utilise",
    date_utilisation: new Date(),
    remis: false,
    date_remise: null,
    remis_par: null,
    id_gain: 1,
    gain_libelle: "Infuseur a the",
    id_user: 7,
    user_nom: "Dupont",
    user_prenom: "Marie",
    user_email: "marie@example.com",
    id_campagne: 1,
    campagne_nom: "Jeu concours",
    date_fin_reclamation: DEMAIN,
    ...overrides,
  };
}

describe("isClaimPeriodOver", () => {
  test("returns false when the deadline is in the future", () => {
    expect(boutiqueService.isClaimPeriodOver(DEMAIN)).toBe(false);
  });

  test("returns true when the deadline has passed", () => {
    expect(boutiqueService.isClaimPeriodOver(HIER)).toBe(true);
  });

  test("returns false when there is no deadline", () => {
    expect(boutiqueService.isClaimPeriodOver(null)).toBe(false);
  });
});

describe("toGainView", () => {
  test("marks a won, undelivered ticket as deliverable", () => {
    const view = boutiqueService.toGainView(buildRow());

    expect(view.peut_etre_remis).toBe(true);
    expect(view.gagnant).toMatchObject({ email: "marie@example.com" });
    expect(view.gain.libelle).toBe("Infuseur a the");
  });

  test("an unused ticket has no winner and cannot be delivered", () => {
    const view = boutiqueService.toGainView(
      buildRow({ id_user: null, statut: "actif" })
    );

    expect(view.gagnant).toBeNull();
    expect(view.peut_etre_remis).toBe(false);
  });

  test("an already delivered ticket cannot be delivered again", () => {
    const view = boutiqueService.toGainView(
      buildRow({ remis: true, date_remise: new Date(), remis_par: 3 })
    );

    expect(view.peut_etre_remis).toBe(false);
    expect(view.remis_par).toBe(3);
  });

  test("a ticket past the claim deadline cannot be delivered", () => {
    const view = boutiqueService.toGainView(
      buildRow({ date_fin_reclamation: HIER })
    );

    expect(view.peut_etre_remis).toBe(false);
  });
});
