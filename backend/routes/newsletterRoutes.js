const express = require("express");
const newsletterController = require("../controllers/newsletterController");

const router = express.Router();

router.post("/", newsletterController.subscribe);

module.exports = router;
