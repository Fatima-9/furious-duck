const BaseModel = require("./BaseModel");

const Ticket = new BaseModel({
  tableName: "tickets",
  primaryKey: "id_ticket",
  columns: [
    "code_ticket",
    "date_generation",
    "date_utilisation",
    "remis",
    "date_remise",
    "statut",
    "gain_id",
    "utilisateur_id",
    "campagne_id",
  ],
});

module.exports = Ticket;