jest.mock("../../models/Utilisateur", () => ({
  findByEmail: jest.fn(),
  findByOAuthIdentity: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../services/oauthProviderService", () => ({
  verifyOAuthToken: jest.fn(),
}));

const bcrypt = require("bcrypt");
const Utilisateur = require("../../models/Utilisateur");
const authService = require("../../services/authService");
const { verifyOAuthToken } = require("../../services/oauthProviderService");

describe("authService", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_EXPIRES_IN = "1d";
    process.env.DEFAULT_USER_ROLE_ID = "1";
    process.env.DEFAULT_BOUTIQUE_ID = "1";
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
      role_id: 2,
      boutique_id: 3,
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.mot_de_passe).toBeUndefined();
    expect(Utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        mot_de_passe: expect.not.stringMatching("Password123!"),
        role_id: 1,
        boutique_id: 1,
      })
    );
  });

  test("register rejects an already used email and missing default ids", async () => {
    Utilisateur.findByEmail.mockResolvedValueOnce({ id_user: 9 });

    await expect(
      authService.register({
        nom: "Duck",
        prenom: "Furious",
        email: "user@example.com",
        mot_de_passe: "Password123!",
      })
    ).rejects.toMatchObject({ statusCode: 409 });

    Utilisateur.findByEmail.mockResolvedValueOnce(null);
    delete process.env.DEFAULT_USER_ROLE_ID;
    await expect(
      authService.register({
        nom: "Duck",
        prenom: "Furious",
        email: "new@example.com",
        mot_de_passe: "Password123!",
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "DEFAULT_USER_ROLE_ID is not configured",
    });
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

  test("login rejects a wrong password and inactive users", async () => {
    const hashedPassword = await bcrypt.hash("Password123!", 4);

    Utilisateur.findByEmail.mockResolvedValueOnce({
      id_user: 1,
      email: "user@example.com",
      mot_de_passe: hashedPassword,
      statut: "actif",
      role_id: 1,
    });

    await expect(
      authService.login({
        email: "user@example.com",
        mot_de_passe: "WrongPassword123!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });

    Utilisateur.findByEmail.mockResolvedValueOnce({
      id_user: 1,
      email: "user@example.com",
      mot_de_passe: hashedPassword,
      statut: "bloque",
      role_id: 1,
    });

    await expect(
      authService.login({
        email: "user@example.com",
        mot_de_passe: "Password123!",
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "user account is not active",
    });
  });

  test("generateToken requires a JWT secret", () => {
    delete process.env.JWT_SECRET;

    expect(() =>
      authService.generateToken({
        id_user: 1,
        email: "user@example.com",
        role_id: 1,
      })
    ).toThrow("JWT_SECRET is not configured");
  });

  test("oauthLogin creates a user from a verified provider profile", async () => {
    verifyOAuthToken.mockResolvedValue({
      subject: "google-subject-1",
      email: "oauth@example.com",
      nom: "Duck",
      prenom: "OAuth",
    });
    Utilisateur.findByOAuthIdentity.mockResolvedValue(null);
    Utilisateur.findByEmail.mockResolvedValue(null);
    Utilisateur.create.mockImplementation(async (data) => ({
      id_user: 2,
      statut: "actif",
      ...data,
    }));

    const result = await authService.oauthLogin({
      provider: "google",
      token: "google-id-token",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.mot_de_passe).toBeUndefined();
    expect(Utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "oauth@example.com",
        type_inscription: "google",
        oauth_provider: "google",
        oauth_subject: "google-subject-1",
        role_id: 1,
        boutique_id: 1,
      })
    );
  });

  test("oauthLogin links an existing email account", async () => {
    verifyOAuthToken.mockResolvedValue({
      subject: "facebook-subject-1",
      email: "existing@example.com",
      nom: "Duck",
      prenom: "OAuth",
    });
    Utilisateur.findByOAuthIdentity.mockResolvedValue(null);
    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 3,
      email: "existing@example.com",
      statut: "actif",
      role_id: 1,
    });
    Utilisateur.update.mockResolvedValue({
      id_user: 3,
      email: "existing@example.com",
      statut: "actif",
      role_id: 1,
      oauth_provider: "facebook",
      oauth_subject: "facebook-subject-1",
    });

    const result = await authService.oauthLogin({
      provider: "facebook",
      token: "facebook-access-token",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(Utilisateur.update).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        oauth_provider: "facebook",
        oauth_subject: "facebook-subject-1",
        type_inscription: "facebook",
      })
    );
  });

  test("oauthLogin returns an existing oauth user", async () => {
    verifyOAuthToken.mockResolvedValue({
      subject: "google-subject-1",
      email: "oauth@example.com",
      nom: "Duck",
      prenom: "OAuth",
    });
    Utilisateur.findByOAuthIdentity.mockResolvedValue({
      id_user: 4,
      email: "oauth@example.com",
      statut: "actif",
      role_id: 1,
    });

    const result = await authService.oauthLogin({
      provider: "google",
      token: "google-id-token",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(Utilisateur.findByEmail).not.toHaveBeenCalled();
  });

  test("oauthLogin rejects inactive oauth or email users", async () => {
    verifyOAuthToken.mockResolvedValue({
      subject: "google-subject-1",
      email: "oauth@example.com",
      nom: "Duck",
      prenom: "OAuth",
    });
    Utilisateur.findByOAuthIdentity.mockResolvedValueOnce({
      id_user: 4,
      email: "oauth@example.com",
      statut: "bloque",
      role_id: 1,
    });

    await expect(
      authService.oauthLogin({ provider: "google", token: "token" })
    ).rejects.toMatchObject({ statusCode: 403 });

    Utilisateur.findByOAuthIdentity.mockResolvedValueOnce(null);
    Utilisateur.findByEmail.mockResolvedValueOnce({
      id_user: 5,
      email: "oauth@example.com",
      statut: "bloque",
      role_id: 1,
    });

    await expect(
      authService.oauthLogin({ provider: "google", token: "token" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("oauthLogin uses explicit default ids when creating a user", async () => {
    verifyOAuthToken.mockResolvedValue({
      subject: "google-subject-2",
      email: "created@example.com",
      nom: "Duck",
      prenom: "OAuth",
    });
    Utilisateur.findByOAuthIdentity.mockResolvedValue(null);
    Utilisateur.findByEmail.mockResolvedValue(null);
    Utilisateur.create.mockImplementation(async (data) => ({
      id_user: 6,
      statut: "actif",
      ...data,
    }));

    await authService.oauthLogin({
      provider: "google",
      token: "google-id-token",
      role_id: 3,
      boutique_id: 4,
    });

    expect(Utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 3,
        boutique_id: 4,
      })
    );
  });
});
