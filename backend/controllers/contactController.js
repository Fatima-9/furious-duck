const { sendContactMessage } = require("../services/contactService");
const { verifyTurnstileToken } = require("../services/turnstileService");
const { validateContactPayload } = require("../validations/contactValidation");

async function sendMessage(req, res) {
  const payload = validateContactPayload(req.body);
  const { turnstile_token: turnstileToken, ...contactPayload } = payload;

  await verifyTurnstileToken(turnstileToken, req.ip);
  await sendContactMessage(contactPayload);

  return res.status(202).json({
    status: "success",
    message: "message sent",
  });
}

module.exports = {
  sendMessage,
};
