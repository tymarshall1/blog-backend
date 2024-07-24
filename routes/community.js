const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const communityController = require("../controllers/communityController");

router.get("/popular", communityController.popularCommunities);

router.post("/create", auth.verifyToken, communityController.createCommunity);

router.get(
  "/follows",
  auth.verifyToken,
  communityController.getFollowedCommunities
);
router.get(
  "/:communityName",
  auth.verifyTokenSoft,
  communityController.getCommunity
);

module.exports = router;
