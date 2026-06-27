const BaseModel = require("./BaseModel");

const Role = new BaseModel({
  tableName: "roles",
  primaryKey: "id_role",
  columns: ["libelle", "statut"],
});

module.exports = Role;
