const boutiqueService = require("../services/boutiqueService");
const { getTicketCodeFromRequest } = require("../validations/ticketValidation");
const { validateWinnerSearch } = require("../validations/boutiqueValidation");

async function findGainByTicket(req, res) {
  const codeTicket = getTicketCodeFromRequest(req);
  const gain = await boutiqueService.findGainByTicketCode(codeTicket);

  return res.json({
    status: "success",
    data: { gain },
  });
}

async function findGainsByWinner(req, res) {
  const criteria = validateWinnerSearch(req.query);
  const gains = await boutiqueService.findGainsByWinner(criteria);

  return res.json({
    status: "success",
    data: { gains },
  });
}

async function markAsRemis(req, res) {
  const codeTicket = getTicketCodeFromRequest(req);
  const gain = await boutiqueService.markTicketAsRemis(
    codeTicket,
    req.user.id_user
  );

  return res.json({
    status: "success",
    data: { gain },
  });
}

module.exports = {
  findGainByTicket,
  findGainsByWinner,
  markAsRemis,
};
