const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middlewares/auth");

router.get("/", auth.verifyToken, profileController.privateUserProfile);

router.put("/", auth.verifyToken, profileController.updateUserProfile);

router.patch(
  "/toggle-followed-community",
  auth.verifyToken,
  profileController.toggleCommunityFollow
);

router.get("/:username", profileController.publicUserProfile);

module.exports = router;
