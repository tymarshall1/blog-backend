const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middlewares/auth");

router.get("/", postController.allArticles);

router.post("/", auth.verifyToken, postController.createArticle);

module.exports = router;
