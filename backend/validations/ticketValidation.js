const ApiError = require("../utils/apiError");

const TICKET_CODE_PATTERN = /^[A-Z0-9]{10}$/;

function normalizeTicketCode(code) {
  if (typeof code !== "string" || code.trim() === "") {
    throw new ApiError(400, "code_ticket is required");
  }

  const normalized = code.trim().toUpperCase();

  if (!TICKET_CODE_PATTERN.test(normalized)) {
    throw new ApiError(400, "code_ticket must contain 10 letters or digits");
  }

  return normalized;
}

function getTicketCodeFromRequest(req) {
  return normalizeTicketCode(req.params.code || req.body.code_ticket);
}

module.exports = {
  normalizeTicketCode,
  getTicketCodeFromRequest,
};
