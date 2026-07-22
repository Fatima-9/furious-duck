jest.mock("../../config/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../../config/db");
const exportService = require("../../services/exportService");

describe("exportService", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("the emailing export never exposes credentials", () => {
    const sensitive = [
      "mot_de_passe",
      "reset_token_hash",
      "reset_token_expires",
      "oauth_subject",
    ];

    sensitive.forEach((field) => {
      expect(exportService.EMAILING_COLUMNS).not.toContain(field);
    });
  });

  test("getEmailingExport converts the participation count to a number", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          id_user: 1,
          nom: "Dupont",
          prenom: "Marie",
          email: "marie@example.com",
          date_inscription: new Date("2026-07-01T10:00:00Z"),
          type_inscription: "email",
          statut: "actif",
          nb_participations: "3",
        },
      ],
    });

    const rows = await exportService.getEmailingExport();

    expect(rows[0].nb_participations).toBe(3);
    expect(rows[0].mot_de_passe).toBeUndefined();
  });

  test("getUserPersonalExport returns the profile and its participations", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id_user: 7, nom: "Dupont", email: "marie@example.com" }],
      })
      .mockResolvedValueOnce({
        rows: [{ code_ticket: "ABCDEFGH12", gain: "Infuseur a the" }],
      });

    const data = await exportService.getUserPersonalExport(7);

    expect(data.profil.id_user).toBe(7);
    expect(data.participations).toHaveLength(1);
    expect(data.genere_le).toEqual(expect.any(String));
  });

  test("getUserPersonalExport rejects an unknown user", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(exportService.getUserPersonalExport(999)).rejects.toMatchObject(
      { statusCode: 404 }
    );
  });
});
