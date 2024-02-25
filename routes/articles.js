const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const auth = require("../middlewares/auth");

router.get("/", articleController.allArticles);

router.post("/", auth.verifyToken, articleController.createArticle);

router.get("/:id", articleController.singleArticle);

router.put("/:id", auth.verifyToken, articleController.updateArticle);

router.delete("/:id", auth.verifyToken, articleController.deleteArticle);

router.post("/:id/comment", articleController.comment);

router.delete(
  "/:id/comment/:commentId",
  auth.verifyToken,
  articleController.removeComment
);

module.exports = router;
