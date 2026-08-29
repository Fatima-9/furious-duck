jest.mock("../../models/Role", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/Utilisateur", () => ({
  findById: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const Role = require("../../models/Role");
const Utilisateur = require("../../models/Utilisateur");
const { authenticate, authorize } = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../config/roles");

function createResponse() {
  return {};
}

describe("authorize", () => {
  beforeEach(() => {
    Role.findById.mockReset();
  });

  test("calls next without error when the role is allowed", async () => {
    Role.findById.mockResolvedValue({ id_role: 2, libelle: ROLES.ADMIN });
    const req = { user: { role_id: 2 } };
    const next = jest.fn();

    await authorize(ROLES.ADMIN)(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.role).toBe(ROLES.ADMIN);
  });

  test("rejects with 403 when the role is not allowed", async () => {
    Role.findById.mockResolvedValue({ id_role: 1, libelle: ROLES.CLIENT });
    const req = { user: { role_id: 1 } };
    const next = jest.fn();

    await authorize(ROLES.ADMIN)(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  test("accepts any of several allowed roles", async () => {
    Role.findById.mockResolvedValue({ id_role: 3, libelle: ROLES.EMPLOYE_BOUTIQUE });
    const req = { user: { role_id: 3 } };
    const next = jest.fn();

    await authorize(ROLES.ADMIN, ROLES.EMPLOYE_BOUTIQUE)(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test("rejects with 401 when the request is not authenticated", async () => {
    const req = {};
    const next = jest.fn();

    await authorize(ROLES.ADMIN)(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
    expect(Role.findById).not.toHaveBeenCalled();
  });

  test("rejects with 403 when the role no longer exists", async () => {
    Role.findById.mockResolvedValue(null);
    const req = { user: { role_id: 99 } };
    const next = jest.fn();

    await authorize(ROLES.ADMIN)(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe("authenticate", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    Utilisateur.findById.mockReset();
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  test("rejects missing bearer token", async () => {
    const next = jest.fn();

    await authenticate({ headers: {} }, createResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
    expect(Utilisateur.findById).not.toHaveBeenCalled();
  });

  test("rejects authentication when JWT_SECRET is not configured", async () => {
    delete process.env.JWT_SECRET;
    const next = jest.fn();

    await authenticate(
      { headers: { authorization: "Bearer token" } },
      createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "JWT_SECRET is not configured",
      })
    );
  });

  test("loads and sanitizes the authenticated user", async () => {
    const token = jwt.sign({ id_user: 7 }, process.env.JWT_SECRET);
    Utilisateur.findById.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      role_id: 1,
      statut: "actif",
      mot_de_passe: "secret",
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    await authenticate(req, createResponse(), next);

    expect(Utilisateur.findById).toHaveBeenCalledWith(7);
    expect(req.user).toMatchObject({ id_user: 7, email: "client@example.com" });
    expect(req.user.mot_de_passe).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test("rejects tokens for missing or inactive users", async () => {
    const token = jwt.sign({ id_user: 8 }, process.env.JWT_SECRET);
    Utilisateur.findById.mockResolvedValue({ id_user: 8, statut: "supprime" });
    const next = jest.fn();

    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  test("rejects malformed tokens", async () => {
    const next = jest.fn();

    await authenticate(
      { headers: { authorization: "Bearer invalid-token" } },
      createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });
});
