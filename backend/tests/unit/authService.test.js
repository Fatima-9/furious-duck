jest.mock("../../models/Utilisateur", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
}));

const bcrypt = require("bcrypt");
const Utilisateur = require("../../models/Utilisateur");
const authService = require("../../services/authService");

describe("authService", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_EXPIRES_IN = "1d";
  });

  test("register hashes the password and returns a safe user with a token", async () => {
    Utilisateur.findByEmail.mockResolvedValue(null);
    Utilisateur.create.mockImplementation(async (data) => ({
      id_user: 1,
      statut: "actif",
      ...data,
    }));

    const result = await authService.register({
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      mot_de_passe: "Password123!",
      role_id: 1,
      boutique_id: 1,
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.mot_de_passe).toBeUndefined();
    expect(Utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        mot_de_passe: expect.not.stringMatching("Password123!"),
      })
    );
  });

  test("login rejects invalid credentials", async () => {
    Utilisateur.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: "missing@example.com",
        mot_de_passe: "Password123!",
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "invalid credentials",
    });
  });

  test("login returns a token for active users", async () => {
    const hashedPassword = await bcrypt.hash("Password123!", 4);

    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 1,
      email: "user@example.com",
      mot_de_passe: hashedPassword,
      statut: "actif",
      role_id: 1,
    });

    const result = await authService.login({
      email: "user@example.com",
      mot_de_passe: "Password123!",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.mot_de_passe).toBeUndefined();
  });
});
