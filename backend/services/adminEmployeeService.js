const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const { ROLES } = require("../config/roles");
const Role = require("../models/Role");
const Utilisateur = require("../models/Utilisateur");
const ApiError = require("../utils/apiError");
const { sanitizeUser } = require("../utils/userPresenter");
const { SALT_ROUNDS } = require("./authService");

function ensureDatabaseConfigured() {
  if (!pool) {
    throw new ApiError(500, "DATABASE_URL is not configured");
  }
}

function normalizePositiveInteger(value, fallback, max = 100) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

async function getEmployeeRoleId() {
  const roles = await pool.query(
    "SELECT id_role FROM roles WHERE libelle = $1 AND statut = 'actif' LIMIT 1",
    [ROLES.EMPLOYE_BOUTIQUE]
  );

  if (!roles.rows[0]) {
    throw new ApiError(500, "employee role is not configured");
  }

  return roles.rows[0].id_role;
}

function buildEmployeeFilters(filters = {}, employeeRoleId) {
  const clauses = ["u.role_id = $1", "u.statut <> 'supprime'"];
  const values = [employeeRoleId];

  const textFilters = [
    ["email", "u.email"],
    ["nom", "u.nom"],
    ["prenom", "u.prenom"],
    ["boutique", "b.nom"],
  ];

  textFilters.forEach(([key, column]) => {
    const value = filters[key];
    if (typeof value === "string" && value.trim() !== "") {
      values.push(`%${value.trim()}%`);
      clauses.push(`${column} ILIKE $${values.length}`);
    }
  });

  if (typeof filters.statut === "string" && ["actif", "inactif"].includes(filters.statut.trim())) {
    values.push(filters.statut.trim());
    clauses.push(`u.statut = $${values.length}`);
  }

  return {
    where: clauses.join(" AND "),
    values,
  };
}

function toEmployeeView(row) {
  return {
    id_user: row.id_user,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    statut: row.statut,
    date_inscription: row.date_inscription,
    boutique_id: row.boutique_id,
    boutique: row.boutique_nom
      ? {
          id_boutique: row.boutique_id,
          nom: row.boutique_nom,
        }
      : null,
    role: row.role_libelle || ROLES.EMPLOYE_BOUTIQUE,
  };
}

async function listActiveBoutiques() {
  ensureDatabaseConfigured();

  const result = await pool.query(
    `
      SELECT id_boutique, nom
      FROM boutiques
      WHERE statut = 'actif'
      ORDER BY nom ASC, id_boutique ASC
    `
  );

  return result.rows.map((row) => ({
    id_boutique: row.id_boutique,
    nom: row.nom,
  }));
}

async function listEmployees(options = {}) {
  ensureDatabaseConfigured();

  const employeeRoleId = await getEmployeeRoleId();
  const page = normalizePositiveInteger(options.page, 1, 100000);
  const limit = normalizePositiveInteger(options.limit, 10, 50);
  const offset = (page - 1) * limit;
  const { where, values } = buildEmployeeFilters(options.filters, employeeRoleId);

  const countResult = await pool.query(
    `
      SELECT count(*) AS total
      FROM utilisateurs u
      LEFT JOIN boutiques b ON b.id_boutique = u.boutique_id
      WHERE ${where}
    `,
    values
  );

  const result = await pool.query(
    `
      SELECT
        u.id_user,
        u.nom,
        u.prenom,
        u.email,
        u.statut,
        u.date_inscription,
        u.boutique_id,
        b.nom AS boutique_nom,
        r.libelle AS role_libelle
      FROM utilisateurs u
      JOIN roles r ON r.id_role = u.role_id
      LEFT JOIN boutiques b ON b.id_boutique = u.boutique_id
      WHERE ${where}
      ORDER BY u.date_inscription DESC, u.id_user DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `,
    [...values, limit, offset]
  );

  const total = Number(countResult.rows[0]?.total || 0);
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    employees: result.rows.map(toEmployeeView),
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_previous: page > 1,
      has_next: page < totalPages,
    },
  };
}

async function createEmployee(payload) {
  const existingUser = await Utilisateur.findByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, "email is already used");
  }

  const hashedPassword = await bcrypt.hash(payload.mot_de_passe, SALT_ROUNDS);
  const employeeRoleId = await getEmployeeRoleId();

  const user = await Utilisateur.create({
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    mot_de_passe: hashedPassword,
    type_inscription: "admin",
    statut: payload.statut || "actif",
    role_id: employeeRoleId,
    boutique_id: payload.boutique_id,
  });

  return sanitizeUser(user);
}

async function assertEmployee(userId) {
  const user = await Utilisateur.findById(userId);
  if (!user) {
    throw new ApiError(404, "employee not found");
  }

  const role = await Role.findById(user.role_id);
  if (!role || role.libelle !== ROLES.EMPLOYE_BOUTIQUE) {
    throw new ApiError(400, "user is not an employee account");
  }

  return user;
}

async function updateEmployee(userId, updates) {
  await assertEmployee(userId);

  if (updates.email) {
    const existingUser = await Utilisateur.findByEmail(updates.email);
    if (existingUser && existingUser.id_user !== userId) {
      throw new ApiError(409, "email is already used");
    }
  }

  const data = { ...updates };
  if (data.mot_de_passe) {
    data.mot_de_passe = await bcrypt.hash(data.mot_de_passe, SALT_ROUNDS);
  }

  const user = await Utilisateur.update(userId, data);
  return sanitizeUser(user);
}

async function deleteEmployee(userId) {
  await assertEmployee(userId);
  const user = await Utilisateur.update(userId, { statut: "supprime" });
  return sanitizeUser(user);
}

module.exports = {
  listActiveBoutiques,
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toEmployeeView,
};
