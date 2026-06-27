const BaseModel = require("./BaseModel");

const Campagne = new BaseModel({
  tableName: "campagnes",
  primaryKey: "id_campagne",
  columns: [
    "nom",
    "date_debut",
    "date_fin",
    "date_fin_reclamation",
    "nombre_tickets_max",
    "statut",
  ],
});

module.exports = Campagne;
