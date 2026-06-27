const BaseModel = require("./BaseModel");

const Utilisateur = new BaseModel({
  tableName: "utilisateurs",
  primaryKey: "id_user",
  columns: [
    "nom",
    "prenom",
    "email",
    "mot_de_passe",
    "date_de_naissance",
    "sexe",
    "type_inscription",
    "date_inscription",
    "statut",
    "role_id",
    "boutique_id",
  ],
});

module.exports = Utilisateur;
