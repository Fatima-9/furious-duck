const jwt = require("jsonwebtoken");
const Utilisateur = require("../models/Utilisateur");
const Role = require("../models/Role");
const ApiError = require("../utils/apiError");
const { sanitizeUser } = require("../utils/userPresenter");

async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new ApiError(401, "authentication token is required");
    }

    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, "JWT_SECRET is not configured");
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Utilisateur.findById(decoded.id_user);

    if (!user || user.statut !== "actif") {
      throw new ApiError(401, "invalid authentication token");
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new ApiError(401, "invalid authentication token"));
    }

    return next(error);
  }
}

// Restreint une route a certains roles. A utiliser TOUJOURS apres `authenticate`,
// qui remplit req.user a partir de la base (donc role_id fiable, un token modifie
// n'y change rien).
//
//   router.get("/stats", authenticate, authorize("admin"), handler)
//
function authorize(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "authentication is required");
      }

      const role = await Role.findById(req.user.role_id);

      if (!role || !allowedRoles.includes(role.libelle)) {
        throw new ApiError(403, "you do not have permission to access this resource");
      }

      // On expose le libelle du role pour les handlers qui en ont besoin.
      req.user.role = role.libelle;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  authenticate,
  authorize,
};
