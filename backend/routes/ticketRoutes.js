const express = require("express");
const ticketController = require("../controllers/ticketController");
const { ROLES } = require("../config/roles");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:code/verify", ticketController.verifyTicket);
router.post(
  "/:code/participate",
  authenticate,
  authorize(ROLES.CLIENT),
  ticketController.participate
);
router.get("/me/history", authenticate, ticketController.getMyGainHistory);

module.exports = router;
