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

  test("verifyTicket returns a public availability response", async () => {
    pool.query.mockResolvedValueOnce({ rows: [createAvailableTicket()] });

    await expect(ticketService.verifyTicket("AB12CD34EF")).resolves.toEqual({
      code_ticket: "AB12CD34EF",
      exists: true,
      canParticipate: true,
      reason: null,
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
});
