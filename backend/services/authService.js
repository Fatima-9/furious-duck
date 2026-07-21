const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Utilisateur = require("../models/Utilisateur");
const ApiError = require("../utils/apiError");
const { sanitizeUser } = require("../utils/userPresenter");

const SALT_ROUNDS = 12;

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
}

function generateToken(user) {
  return jwt.sign(
    {
      id_user: user.id_user,
      email: user.email,
      role_id: user.role_id,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

async function register(payload) {
  const existingUser = await Utilisateur.findByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, "email is already used");
  }

  const hashedPassword = await bcrypt.hash(payload.mot_de_passe, SALT_ROUNDS);

  const user = await Utilisateur.create({
    ...payload,
    mot_de_passe: hashedPassword,
  });

  return {
    user: sanitizeUser(user),
    token: generateToken(user),
  };
}

async function login({ email, mot_de_passe }) {
  const user = await Utilisateur.findByEmail(email);
  if (!user) {
    throw new ApiError(401, "invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
  if (!passwordMatches) {
    throw new ApiError(401, "invalid credentials");
  }

  if (user.statut !== "actif") {
    throw new ApiError(403, "user account is not active");
  }

  return {
    user: sanitizeUser(user),
    token: generateToken(user),
  };
}

module.exports = {
  register,
  login,
  generateToken,
  SALT_ROUNDS,
};
