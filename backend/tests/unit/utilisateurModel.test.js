jest.mock("../../config/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../../config/db");
const Utilisateur = require("../../models/Utilisateur");

describe("Utilisateur model custom finders", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("findByEmail returns a user or null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1 }] });
    await expect(Utilisateur.findByEmail("client@example.com")).resolves.toEqual({
      id_user: 1,
    });
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM utilisateurs WHERE email = $1",
      ["client@example.com"]
    );

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(Utilisateur.findByEmail("missing@example.com")).resolves.toBeNull();
  });

  test("findByResetTokenHash returns a user or null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 2 }] });
    await expect(Utilisateur.findByResetTokenHash("hash")).resolves.toEqual({
      id_user: 2,
    });

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(Utilisateur.findByResetTokenHash("missing")).resolves.toBeNull();
  });

  test("findByOAuthIdentity returns a user or null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 3 }] });
    await expect(
      Utilisateur.findByOAuthIdentity("google", "subject")
    ).resolves.toEqual({ id_user: 3 });
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM utilisateurs WHERE oauth_provider = $1 AND oauth_subject = $2",
      ["google", "subject"]
    );

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      Utilisateur.findByOAuthIdentity("google", "missing")
    ).resolves.toBeNull();
  });
});
