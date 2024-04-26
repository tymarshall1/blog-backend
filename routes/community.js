const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const communityController = require("../controllers/communityController");

router.post("/create", auth.verifyToken, communityController.createCommunity);

module.exports = router;
