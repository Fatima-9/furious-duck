const authService = require("../services/authService");
const {
  validateRegisterPayload,
  validateLoginPayload,
} = require("../validations/authValidation");

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

module.exports = {
  register,
  login,
};
