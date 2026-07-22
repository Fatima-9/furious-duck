const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Toutes les routes admin exigent un token valide ET le role admin.
// Un utilisateur simple ou un employe boutique recoit une 403.
router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/stats", adminController.getOverview);
router.get("/stats/tickets", adminController.getTicketStats);
router.get("/stats/gains", adminController.getGainStats);
router.get("/stats/utilisateurs", adminController.getUserStats);

module.exports = router;
