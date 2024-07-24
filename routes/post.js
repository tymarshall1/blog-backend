const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middlewares/auth");

router.get("/", postController.getPosts);

router.post("/create", auth.verifyToken, postController.createPost);

router.get("/:id", postController.singlePost);

router.put("/:id", auth.verifyToken, postController.updatePost);

router.delete("/:id", auth.verifyToken, postController.deletePost);

router.post("/:id/comment", auth.verifyToken, postController.comment);

router.patch(
  "/:id/reaction",
  auth.verifyToken,
  postController.togglePostReaction
);

router.patch(
  "/comment/:id/reaction",
  auth.verifyToken,
  postController.toggleCommentReaction
);

router.delete(
  "/:id/comment/:commentId",
  auth.verifyToken,
  postController.removeComment
);

router.get("/comment-thread/:commentId", postController.commentThread);

module.exports = router;
