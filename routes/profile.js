const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middlewares/auth");

router.get("/", auth.verifyToken, profileController.privateUserProfile);

router.put("/", auth.verifyToken, profileController.updateUserProfile);

router.get("/:username", profileController.publicUserProfile);

module.exports = router;
