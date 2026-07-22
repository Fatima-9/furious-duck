const exportService = require("../services/exportService");
const { toCsv } = require("../utils/csv");

// Le BOM UTF-8 permet a Excel d'afficher correctement les accents.
const UTF8_BOM = "﻿";

async function exportEmailing(req, res) {
  const utilisateurs = await exportService.getEmailingExport();

  if (String(req.query.format).toLowerCase() === "csv") {
    const csv = toCsv(utilisateurs, exportService.EMAILING_COLUMNS);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="export-emailing.csv"'
    );

    return res.send(UTF8_BOM + csv);
  }

  return res.json({
    status: "success",
    data: {
      total: utilisateurs.length,
      utilisateurs,
    },
  });
}

async function exportMyData(req, res) {
  const donnees = await exportService.getUserPersonalExport(req.user.id_user);

  return res.json({
    status: "success",
    data: donnees,
  });
}

module.exports = {
  exportEmailing,
  exportMyData,
};
