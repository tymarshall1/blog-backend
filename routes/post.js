const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middlewares/auth");

router.get("/", postController.allPosts);

router.post("/create", auth.verifyToken, postController.createPost);

router.get("/:id", postController.singlePost);

router.put("/:id", auth.verifyToken, postController.updatePost);

router.delete("/:id", auth.verifyToken, postController.deletePost);

router.post("/:id/comment", auth.verifyToken, postController.comment);

router.delete(
  "/:id/comment/:commentId",
  auth.verifyToken,
  postController.removeComment
);

module.exports = router;
