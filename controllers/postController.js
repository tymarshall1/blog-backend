const { body, validationResult } = require("express-validator");
const Article = require("../models/post");
const Comment = require("../models/comment");

exports.allPosts = async (req, res) => {
  try {
    const posts = await Article.find({ published: true })
      .populate({ path: "author", select: "username" })
      .populate({
        path: "comments",
        select: "email comment",
      })
      .exec();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).send("error finding posts");
  }
};

exports.createPost = [
  body(
    "title",
    "title must not be empty and have a minimum length of 2 characters"
  )
    .notEmpty()
    .isString()
    .trim()
    .toLowerCase()
    .isLength({ min: 2 }),
  body(
    "body",
    "body must not be empty and have a minimum length of 2 characters"
  )
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2 }),
  body("published", "published field must be a boolean")
    .notEmpty()
    .isBoolean()
    .escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.json(errors);
    else {
      const article = Article({
        title: req.body.title,
        body: req.body.body,
        author: req.user.id,
        published: req.body.published,
      });

      try {
        await article.save();
      } catch (err) {
        res.status(500).send("error saving data");
      }

      res.status(200).json(article);
    }
  },
];

exports.singlePost = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res.status(404).json({ error: "unable to find article" });
    res.status(200).json(article);
  } catch (err) {
    res.status(404).json({ error: "unable to find article" });
  }
};

exports.updatePost = [
  body(
    "title",
    "title must not be empty and have a minimum length of 2 characters"
  )
    .notEmpty()
    .isString()
    .trim()
    .toLowerCase()
    .isLength({ min: 2 }),
  body(
    "body",
    "body must not be empty and have a minimum length of 2 characters"
  )
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2 }),
  body("published", "published field must be a boolean")
    .notEmpty()
    .isBoolean()
    .escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.json(errors);
    else {
      try {
        const article = await Article.findByIdAndUpdate(
          req.params.id,
          {
            title: req.body.title,
            body: req.body.body,
            author: req.user.id,
            published: req.body.published,
          },
          { new: true }
        );
        res.status(200).json(article);
      } catch (err) {
        res.status(404).json({ error: "unable to find article" });
      }
    }
  },
];

exports.deletePost = async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: `Article ${req.params.id} was deleted successfully` });
  } catch (err) {
    res.status(404).json({ error: "unable to find article" });
  }
};

exports.comment = [
  body("email", "incorrect email formatting")
    .notEmpty()
    .isString()
    .trim()
    .toLowerCase()
    .escape(),
  body("comment", "comment must be at least 2 characters long")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.json(errors);
    else {
      const comment = new Comment({
        email: req.body.email,
        comment: req.body.comment,
        article: req.params.id,
      });
      try {
        await comment.save();
        res.status(200).json(comment);
      } catch (err) {
        res.status(500).json({ message: "Couldn't save comment" });
      }
    }
  },
];

exports.removeComment = async (req, res) => {
  try {
    await Comment.findOneAndDelete(req.params.commentId);
    res.status(200).json({ message: "comment successfully deleted!" });
  } catch (err) {
    res.status(404).json({ message: "Couldn't delete comment" });
  }
};
