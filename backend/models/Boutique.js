const BaseModel = require("./BaseModel");

const Boutique = new BaseModel({
  tableName: "boutiques",
  primaryKey: "id_boutique",
  columns: ["nom", "email", "adresse", "code_postal", "ville", "pays", "statut"],
});

module.exports = Boutique;
