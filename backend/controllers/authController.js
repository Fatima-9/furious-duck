const authService = require("../services/authService");
const passwordResetService = require("../services/passwordResetService");
const {
  validateRegisterPayload,
  validateLoginPayload,
  validateOAuthPayload,
} = require("../validations/authValidation");
const {
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
} = require("../validations/passwordResetValidation");

async function register(req, res) {
  const payload = validateRegisterPayload(req.body);
  const result = await authService.register(payload);

  return res.status(201).json({
    status: "success",
    data: result,
  });
}

async function login(req, res) {
  const payload = validateLoginPayload(req.body);
  const result = await authService.login(payload);

  return res.json({
    status: "success",
    data: result,
  });
}

async function forgotPassword(req, res) {
  const payload = validateForgotPasswordPayload(req.body);
  const { resetToken } = await passwordResetService.requestPasswordReset(payload);

  // Tant que l'envoi d'email n'est pas branche, on affiche le token dans les
  // logs du serveur pour pouvoir tester la suite.
  if (resetToken && process.env.NODE_ENV !== "production") {
    console.log(`[reset] token for ${payload.email}: ${resetToken}`);
  }

  // Toujours la meme reponse, que le compte existe ou non.
  return res.json({
    status: "success",
    message: "if the account exists, a reset link has been sent",
  });
}

async function resetPassword(req, res) {
  const payload = validateResetPasswordPayload(req.body);
  await passwordResetService.resetPassword(payload);

  return res.json({
    status: "success",
    message: "password has been updated",
  });
}

async function oauth(req, res) {
  const payload = validateOAuthPayload(req.body);
  const result = await authService.oauthLogin(payload);

  return res.json({
    status: "success",
    data: result,
  });
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  oauth,
};
