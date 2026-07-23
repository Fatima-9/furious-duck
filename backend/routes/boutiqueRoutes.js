const express = require("express");
const boutiqueController = require("../controllers/boutiqueController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Reserve aux employes boutique. L'admin y a aussi acces pour pouvoir
// depanner une boutique sans changer de compte.
router.use(authenticate, authorize(ROLES.EMPLOYE_BOUTIQUE, ROLES.ADMIN));

router.get("/participations", boutiqueController.listClientParticipations);
router.get("/gains", boutiqueController.findGainsByWinner);
router.get("/tickets/:code", boutiqueController.findGainByTicket);
router.patch("/tickets/:code/remise", boutiqueController.markAsRemis);

module.exports = router;
