const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Utilisateur = require("../models/Utilisateur");
const ApiError = require("../utils/apiError");
const { sanitizeUser } = require("../utils/userPresenter");
const { verifyOAuthToken } = require("./oauthProviderService");

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

function resolveDefaultId(payloadValue, envName) {
  const value = payloadValue || process.env[envName];

  if (!Number.isInteger(Number(value))) {
    throw new ApiError(500, `${envName} is not configured`);
  }

  return Number(value);
}

async function oauthLogin({ provider, token, role_id, boutique_id }) {
  const oauthProfile = await verifyOAuthToken(provider, token);
  const existingOAuthUser = await Utilisateur.findByOAuthIdentity(
    provider,
    oauthProfile.subject
  );

  if (existingOAuthUser) {
    if (existingOAuthUser.statut !== "actif") {
      throw new ApiError(403, "user account is not active");
    }

    return {
      user: sanitizeUser(existingOAuthUser),
      token: generateToken(existingOAuthUser),
    };
  }

  const existingEmailUser = await Utilisateur.findByEmail(oauthProfile.email);

  if (existingEmailUser) {
    if (existingEmailUser.statut !== "actif") {
      throw new ApiError(403, "user account is not active");
    }

    const user = await Utilisateur.update(existingEmailUser.id_user, {
      oauth_provider: provider,
      oauth_subject: oauthProfile.subject,
      type_inscription: provider,
    });

    return {
      user: sanitizeUser(user),
      token: generateToken(user),
    };
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

  const user = await Utilisateur.create({
    nom: oauthProfile.nom,
    prenom: oauthProfile.prenom,
    email: oauthProfile.email,
    mot_de_passe: hashedPassword,
    type_inscription: provider,
    role_id: resolveDefaultId(role_id, "DEFAULT_USER_ROLE_ID"),
    boutique_id: resolveDefaultId(boutique_id, "DEFAULT_BOUTIQUE_ID"),
    oauth_provider: provider,
    oauth_subject: oauthProfile.subject,
  });

  return {
    user: sanitizeUser(user),
    token: generateToken(user),
  };
}

module.exports = {
  register,
  login,
  oauthLogin,
  generateToken,
  SALT_ROUNDS,
};
