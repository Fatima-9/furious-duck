const ticketService = require("../services/ticketService");
const { getTicketCodeFromRequest } = require("../validations/ticketValidation");

async function verifyTicket(req, res) {
  const codeTicket = getTicketCodeFromRequest(req);
  const ticket = await ticketService.verifyTicket(codeTicket);

  return res.json({
    status: "success",
    data: { ticket },
  });
}

async function participate(req, res) {
  const codeTicket = getTicketCodeFromRequest(req);
  const ticket = await ticketService.participateWithTicket(
    req.user.id_user,
    codeTicket
  );

  return res.status(201).json({
    status: "success",
    data: { ticket },
  });
}

async function getMyGainHistory(req, res) {
  const gains = await ticketService.getUserGainHistory(req.user.id_user);

  return res.json({
    status: "success",
    data: { gains },
  });
}

module.exports = {
  verifyTicket,
  participate,
  getMyGainHistory,
};
