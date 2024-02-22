const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middlewares/auth");

router.get("/", postController.allArticles);

router.post("/", auth.verifyToken, postController.createArticle);

router.get("/:id", postController.singleArticle);

router.put("/:id", auth.verifyToken, postController.updateArticle);

router.delete("/:id", auth.verifyToken, postController.deleteArticle);

module.exports = router;
