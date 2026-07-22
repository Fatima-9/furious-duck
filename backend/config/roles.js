// Libelles des roles, tels que stockes dans la table `roles`.
// On reference ces constantes partout plutot que d'ecrire les chaines a la main,
// pour eviter les fautes de frappe et retrouver facilement les usages.
const ROLES = {
  CLIENT: "client",
  ADMIN: "admin",
  EMPLOYE_BOUTIQUE: "employe_boutique",
};

module.exports = {
  ROLES,
};
