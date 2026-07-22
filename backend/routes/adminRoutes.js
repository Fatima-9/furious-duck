const express = require("express");
const adminController = require("../controllers/adminController");
const exportController = require("../controllers/exportController");
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

// Export des contacts pour l'emailing. ?format=csv pour un fichier importable
// directement dans un outil de mailing.
router.get("/export/emailing", exportController.exportEmailing);

module.exports = router;
