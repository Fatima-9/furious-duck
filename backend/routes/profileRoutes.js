const express = require("express");
const profileController = require("../controllers/profileController");
const exportController = require("../controllers/exportController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

// Toutes les routes de ce fichier exigent un token valide.
router.use(authenticate);

router.get("/me", profileController.getMyProfile);
router.patch("/me", profileController.updateMyProfile);
router.patch("/me/password", profileController.changeMyPassword);

// Droit a la portabilite (RGPD art. 20) : chacun recupere ses propres donnees.
router.get("/me/export", exportController.exportMyData);

module.exports = router;
