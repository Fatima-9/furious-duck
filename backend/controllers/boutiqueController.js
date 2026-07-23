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

async function listClientParticipations(req, res) {
  const result = await boutiqueService.listClientParticipations({
    page: req.query.page,
    limit: req.query.limit,
    filters: req.query,
  });

  return res.json({
    status: "success",
    data: result,
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
  listClientParticipations,
  findGainByTicket,
  findGainsByWinner,
  markAsRemis,
};
