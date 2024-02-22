const auth = require("../middlewares/auth");
const { body, validationResult } = require("express-validator");
const Article = require("../models/article");
const User = require("../models/user");

exports.allArticles = async (req, res) => {
  try {
    const articles = await Article.find({ published: true })
      .populate({ path: "author", select: "username" })
      .exec();
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).send("error finding articles");
  }
};

exports.createArticle = [
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

exports.singleArticle = async (req, res) => {
  console.log(req.params.id);
  try {
    const article = await Article.findById(req.params.id);
    res.status(200).json(article);
  } catch (err) {
    res.status(404).json({ error: "unable to find article" });
  }
};

exports.updateArticle = [
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

exports.deleteArticle = async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: `Article ${req.params.id} was deleted successfully` });
  } catch (err) {
    res.status(404).json({ error: "unable to find article" });
  }
};
