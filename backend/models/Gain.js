const BaseModel = require("./BaseModel");

const Gain = new BaseModel({
  tableName: "gains",
  primaryKey: "id_gain",
  columns: [
    "libelle",
    "pourcentage_distribution",
    "quantite_total",
    "quantite_restante",
    "statut",
  ],
});

module.exports = Gain;
