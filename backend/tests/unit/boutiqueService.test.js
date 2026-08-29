jest.mock("../../config/db", () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const boutiqueService = require("../../services/boutiqueService");
const { pool } = require("../../config/db");

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
  test("returns null for empty rows", () => {
    expect(boutiqueService.toGainView(null)).toBeNull();
  });

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

describe("listClientParticipations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns paginated participations with filters", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: "23", lots_gagnes: "23", lots_retires: "8" }] })
      .mockResolvedValueOnce({ rows: [buildRow()] });

    const result = await boutiqueService.listClientParticipations({
      page: "2",
      limit: "10",
      filters: { email: "marie", remis: "false" },
    });

    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 23,
      total_pages: 3,
      has_previous: true,
      has_next: true,
    });
    expect(result.stats).toEqual({
      total_participations: 23,
      lots_gagnes: 23,
      lots_retires: 8,
    });
    expect(result.participations[0]).toMatchObject({
      code_ticket: "ABCDEFGH12",
      utilisateur: { email: "marie@example.com" },
      gain: { libelle: "Infuseur a the" },
    });
    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("LIMIT $3"),
      ["%marie%", false, 10, 10]
    );
  });

  test("normalizes invalid pagination and empty count rows", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await boutiqueService.listClientParticipations({
      page: "bad",
      limit: "999",
      filters: {
        code_ticket: " ABC ",
        nom: " Dupont ",
        prenom: " Marie ",
        gain: " Infuseur ",
        statut: " utilise ",
        date_utilisation: "2026-09",
      },
    });

    expect(result.pagination).toMatchObject({
      page: 1,
      limit: 50,
      total: 0,
      total_pages: 1,
      has_previous: false,
      has_next: false,
    });
    expect(pool.query.mock.calls[0][1]).toEqual([
      "%ABC%",
      "%Dupont%",
      "%Marie%",
      "%Infuseur%",
      "%utilise%",
      "2026-09%",
    ]);
  });

  test("findGainByTicketCode returns a gain or rejects a missing ticket", async () => {
    pool.query.mockResolvedValueOnce({ rows: [buildRow()] });

    await expect(
      boutiqueService.findGainByTicketCode("ABCDEFGH12")
    ).resolves.toMatchObject({
      code_ticket: "ABCDEFGH12",
      gain: { libelle: "Infuseur a the" },
    });

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      boutiqueService.findGainByTicketCode("MISSING1234")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "ticket not found",
    });
  });

  test("findGainsByWinner searches by name and maps gains", async () => {
    pool.query.mockResolvedValueOnce({ rows: [buildRow()] });

    const result = await boutiqueService.findGainsByWinner({
      type: "nom",
      value: "Dupont",
    });

    expect(pool.query.mock.calls[0][1]).toEqual(["%Dupont%"]);
    expect(result[0].gagnant.email).toBe("marie@example.com");
  });

  test("markTicketAsRemis marks a deliverable prize", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [buildRow()] })
      .mockResolvedValueOnce({
        rows: [{ remis: true, date_remise: new Date(), remis_par: 12 }],
      })
      .mockResolvedValueOnce({});

    const result = await boutiqueService.markTicketAsRemis("ABCDEFGH12", 12);

    expect(result.remis).toBe(true);
    expect(result.remis_par).toBe(12);
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  test("markTicketAsRemis rejects invalid delivery states and rolls back", async () => {
    const states = [
      [{ rows: [] }, { statusCode: 404, message: "ticket not found" }],
      [
        { rows: [buildRow({ id_user: null })] },
        { statusCode: 409, message: "ticket has not been used yet" },
      ],
      [
        { rows: [buildRow({ remis: true })] },
        { statusCode: 409, message: "prize has already been delivered" },
      ],
      [
        { rows: [buildRow({ date_fin_reclamation: HIER })] },
        { statusCode: 409, message: "claim period is over" },
      ],
    ];

    for (const [selectResult, expectedError] of states) {
      const client = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValueOnce(client);
      client.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(selectResult)
        .mockResolvedValueOnce({});

      await expect(
        boutiqueService.markTicketAsRemis("ABCDEFGH12", 12)
      ).rejects.toMatchObject(expectedError);
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
    }
  });
});
