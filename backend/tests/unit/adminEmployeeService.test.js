jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

jest.mock("../../config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock("../../models/Utilisateur", () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../models/Role", () => ({
  findById: jest.fn(),
}));

const bcrypt = require("bcrypt");
const { pool } = require("../../config/db");
const Role = require("../../models/Role");
const Utilisateur = require("../../models/Utilisateur");
const adminEmployeeService = require("../../services/adminEmployeeService");

describe("adminEmployeeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed-password");
  });

  test("listEmployees returns a paginated list", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_role: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: "12" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id_user: 5,
            nom: "Boutique",
            prenom: "Employe",
            email: "employe@example.com",
            statut: "actif",
            boutique_id: 1,
            boutique_nom: "Paris",
            role_libelle: "employe_boutique",
          },
        ],
      });

    const result = await adminEmployeeService.listEmployees({
      page: "2",
      limit: "10",
      filters: { email: "employe" },
    });

    expect(result.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 12,
      total_pages: 2,
    });
    expect(result.employees[0]).toMatchObject({
      email: "employe@example.com",
      role: "employe_boutique",
    });
  });

  test("listEmployees normalizes filters and empty count", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_role: 3 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id_user: 6,
            nom: "Sans",
            prenom: "Boutique",
            email: "sans@example.com",
            statut: "actif",
            boutique_id: null,
            boutique_nom: null,
            role_libelle: null,
          },
        ],
      });

    const result = await adminEmployeeService.listEmployees({
      page: "bad",
      limit: "999",
      filters: {
        nom: "Sans",
        prenom: "Boutique",
        statut: "actif",
        boutique: "Paris",
      },
    });

    expect(result.pagination).toMatchObject({
      page: 1,
      limit: 50,
      total: 0,
      total_pages: 1,
    });
    expect(result.employees[0].boutique).toBeNull();
    expect(result.employees[0].role).toBe("employe_boutique");
  });

  test("listEmployees rejects when the employee role is missing", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(adminEmployeeService.listEmployees()).rejects.toMatchObject({
      statusCode: 500,
      message: "employee role is not configured",
    });
  });

  test("listActiveBoutiques returns active boutiques ordered for a select", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id_boutique: 2, nom: "Lyon" },
        { id_boutique: 1, nom: "Paris" },
      ],
    });

    await expect(adminEmployeeService.listActiveBoutiques()).resolves.toEqual([
      { id_boutique: 2, nom: "Lyon" },
      { id_boutique: 1, nom: "Paris" },
    ]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("FROM boutiques"));
  });

  test("createEmployee forces the employee role", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_role: 3 }] });
    Utilisateur.findByEmail.mockResolvedValueOnce(null);
    Utilisateur.create.mockResolvedValueOnce({
      id_user: 5,
      email: "employe@example.com",
      role_id: 3,
      mot_de_passe: "hashed-password",
    });

    const result = await adminEmployeeService.createEmployee({
      nom: "Boutique",
      prenom: "Employe",
      email: "employe@example.com",
      mot_de_passe: "Password!1",
      boutique_id: 1,
      statut: "actif",
    });

    expect(Utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 3,
        mot_de_passe: "hashed-password",
      })
    );
    expect(result.mot_de_passe).toBeUndefined();
  });

  test("createEmployee rejects an already used email", async () => {
    Utilisateur.findByEmail.mockResolvedValueOnce({ id_user: 99 });

    await expect(
      adminEmployeeService.createEmployee({
        nom: "Boutique",
        prenom: "Employe",
        email: "employe@example.com",
        mot_de_passe: "Password!1",
        boutique_id: 1,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "email is already used",
    });
  });

  test("updateEmployee updates email and password", async () => {
    Utilisateur.findById.mockResolvedValueOnce({ id_user: 5, role_id: 3 });
    Role.findById.mockResolvedValueOnce({ id_role: 3, libelle: "employe_boutique" });
    Utilisateur.findByEmail.mockResolvedValueOnce({ id_user: 5 });
    Utilisateur.update.mockResolvedValueOnce({
      id_user: 5,
      email: "same@example.com",
      mot_de_passe: "hashed-password",
    });

    const result = await adminEmployeeService.updateEmployee(5, {
      email: "same@example.com",
      mot_de_passe: "Password!2",
    });

    expect(Utilisateur.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        email: "same@example.com",
        mot_de_passe: "hashed-password",
      })
    );
    expect(result.mot_de_passe).toBeUndefined();
  });

  test("updateEmployee rejects duplicate emails and non-employee accounts", async () => {
    Utilisateur.findById.mockResolvedValueOnce({ id_user: 5, role_id: 3 });
    Role.findById.mockResolvedValueOnce({ id_role: 3, libelle: "employe_boutique" });
    Utilisateur.findByEmail.mockResolvedValueOnce({ id_user: 6 });

    await expect(
      adminEmployeeService.updateEmployee(5, { email: "used@example.com" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "email is already used",
    });

    Utilisateur.findById.mockResolvedValueOnce(null);
    await expect(adminEmployeeService.updateEmployee(404, {})).rejects.toMatchObject({
      statusCode: 404,
      message: "employee not found",
    });

    Utilisateur.findById.mockResolvedValueOnce({ id_user: 5, role_id: 1 });
    Role.findById.mockResolvedValueOnce({ id_role: 1, libelle: "client" });
    await expect(adminEmployeeService.updateEmployee(5, {})).rejects.toMatchObject({
      statusCode: 400,
      message: "user is not an employee account",
    });
  });

  test("deleteEmployee marks an employee account as deleted", async () => {
    Utilisateur.findById.mockResolvedValueOnce({ id_user: 5, role_id: 3 });
    Role.findById.mockResolvedValueOnce({ id_role: 3, libelle: "employe_boutique" });
    Utilisateur.update.mockResolvedValueOnce({ id_user: 5, statut: "supprime" });

    await expect(adminEmployeeService.deleteEmployee(5)).resolves.toMatchObject({
      id_user: 5,
      statut: "supprime",
    });
    expect(Utilisateur.update).toHaveBeenCalledWith(5, { statut: "supprime" });
  });
});
