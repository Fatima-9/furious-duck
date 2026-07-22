const adminStatsService = require("../services/adminStatsService");

async function getTicketStats(req, res) {
  const tickets = await adminStatsService.getTicketStats();

  return res.json({
    status: "success",
    data: { tickets },
  });
}

async function getGainStats(req, res) {
  const gains = await adminStatsService.getGainStats();

  return res.json({
    status: "success",
    data: { gains },
  });
}

async function getUserStats(req, res) {
  const utilisateurs = await adminStatsService.getUserStats();

  return res.json({
    status: "success",
    data: { utilisateurs },
  });
}

async function getOverview(req, res) {
  const stats = await adminStatsService.getOverview();

  return res.json({
    status: "success",
    data: stats,
  });
}

module.exports = {
  getTicketStats,
  getGainStats,
  getUserStats,
  getOverview,
};
