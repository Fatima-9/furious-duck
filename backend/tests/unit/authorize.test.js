jest.mock("../../models/Role", () => ({
  findById: jest.fn(),
}));

const Role = require("../../models/Role");
const { authorize } = require("../../middlewares/authMiddleware");
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
