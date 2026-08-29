jest.mock("../../config/db", () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

const { pool } = require("../../config/db");
const ticketService = require("../../services/ticketService");

function createAvailableTicket(overrides = {}) {
  const now = new Date();

  return {
    id_ticket: 1,
    code_ticket: "AB12CD34EF",
    statut: "actif",
    date_utilisation: null,
    utilisateur_id: null,
    remis: false,
    date_remise: null,
    gain_id: 2,
    id_gain: 2,
    gain_libelle: "Infuseur a the",
    id_campagne: 3,
    campagne_nom: "Campagne test",
    date_debut: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    date_fin: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    date_fin_reclamation: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    campagne_statut: "actif",
    ...overrides,
  };
}

describe("ticketService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buildTicketCodes returns unique 10-character codes", () => {
    const codes = ticketService.buildTicketCodes(50);

    expect(codes).toHaveLength(50);
    expect(new Set(codes).size).toBe(50);
    codes.forEach((code) => expect(code).toMatch(/^[A-Z0-9]{10}$/));
  });

  test("toPublicTicket returns null for empty rows", () => {
    expect(ticketService.toPublicTicket(null)).toBeNull();
  });

  test("getParticipationState marks an available ticket as usable", () => {
    expect(ticketService.getParticipationState(createAvailableTicket())).toEqual({
      exists: true,
      canParticipate: true,
      reason: null,
    });
  });

  test("getParticipationState rejects an already used ticket", () => {
    expect(
      ticketService.getParticipationState(
        createAvailableTicket({
          utilisateur_id: 10,
          date_utilisation: new Date(),
          statut: "utilise",
        })
      )
    ).toEqual({
      exists: true,
      canParticipate: false,
      reason: "already_used",
    });
  });

  test("getParticipationState rejects tickets before start, after claim end or inactive campaign", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(
      ticketService.getParticipationState(createAvailableTicket({ date_debut: future }))
    ).toMatchObject({ canParticipate: false, reason: "campaign_not_started" });

    expect(
      ticketService.getParticipationState(
        createAvailableTicket({
          date_fin_reclamation: null,
          date_fin: past,
        })
      )
    ).toMatchObject({ canParticipate: false, reason: "campaign_finished" });

    expect(
      ticketService.getParticipationState(
        createAvailableTicket({ campagne_statut: "terminee" })
      )
    ).toMatchObject({ canParticipate: false, reason: "campaign_inactive" });
  });

  test("verifyTicket returns a public availability response", async () => {
    pool.query.mockResolvedValueOnce({ rows: [createAvailableTicket()] });

    await expect(ticketService.verifyTicket("AB12CD34EF")).resolves.toEqual({
      code_ticket: "AB12CD34EF",
      exists: true,
      canParticipate: true,
      reason: null,
    });
  });

  test("verifyTicket reports a missing ticket", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(ticketService.verifyTicket("ZZZZZZZZZZ")).resolves.toEqual({
      code_ticket: "ZZZZZZZZZZ",
      exists: false,
      canParticipate: false,
      reason: "not_found",
    });
  });

  test("participateWithTicket assigns the ticket and decrements remaining prizes", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [createAvailableTicket()] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({
        rows: [
          {
            id_ticket: 1,
            code_ticket: "AB12CD34EF",
            statut: "utilise",
            date_utilisation: new Date(),
            utilisateur_id: 7,
            remis: false,
            date_remise: null,
            gain_id: 2,
            campagne_id: 3,
          },
        ],
      }) // UPDATE tickets
      .mockResolvedValueOnce({}) // UPDATE gains
      .mockResolvedValueOnce({}); // COMMIT

    const result = await ticketService.participateWithTicket(7, "AB12CD34EF");

    expect(result).toMatchObject({
      code_ticket: "AB12CD34EF",
      statut: "utilise",
      gain: {
        id_gain: 2,
        libelle: "Infuseur a the",
      },
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE gains"),
      [2]
    );
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  test("participateWithTicket refuses a ticket that was already used", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          createAvailableTicket({
            utilisateur_id: 8,
            date_utilisation: new Date(),
            statut: "utilise",
          }),
        ],
      })
      .mockResolvedValueOnce({});

    await expect(
      ticketService.participateWithTicket(7, "AB12CD34EF")
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "ticket cannot be used: already_used",
    });

    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  test("participateWithTicket rejects a missing ticket", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    await expect(
      ticketService.participateWithTicket(7, "AB12CD34EF")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "ticket not found",
    });
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  test("getUserGainHistory returns public tickets", async () => {
    pool.query.mockResolvedValueOnce({ rows: [createAvailableTicket()] });

    const result = await ticketService.getUserGainHistory(7);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE t.utilisateur_id = $1"), [7]);
    expect(result[0]).toMatchObject({
      code_ticket: "AB12CD34EF",
      gain: { libelle: "Infuseur a the" },
      campagne: { id_campagne: 3 },
    });
  });

  test("generateCampaignTickets validates total and dates", async () => {
    await expect(
      ticketService.generateCampaignTickets({ totalTickets: 0 })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "totalTickets must be a positive integer",
    });

    await expect(
      ticketService.generateCampaignTickets({
        totalTickets: 10,
        dateDebut: "not-a-date",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "campaign dates must be valid",
    });
  });

  test("generateCampaignTickets creates campaign, prizes and ticket batches", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id_campagne: 4, nom: "Campagne" }] })
      .mockResolvedValue({ rows: [{ id_gain: 9, libelle: "Lot" }] });

    const result = await ticketService.generateCampaignTickets({
      totalTickets: 10,
      campaignName: "Campagne",
      dateDebut: "2026-09-01",
      dateFin: "2026-09-30",
      dateFinReclamation: "2026-10-30",
    });

    expect(result.campaign).toEqual({ id_campagne: 4, nom: "Campagne" });
    expect(result.totalTickets).toBe(10);
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  test("generateCampaignTickets rolls back on insert failure", async () => {
    const client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id_campagne: 4, nom: "Campagne" }] })
      .mockRejectedValueOnce(new Error("insert failed"))
      .mockResolvedValueOnce({});

    await expect(
      ticketService.generateCampaignTickets({ totalTickets: 10 })
    ).rejects.toThrow("insert failed");
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });
});
