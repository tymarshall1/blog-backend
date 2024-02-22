const auth = require("../middlewares/auth");

exports.allArticles = (req, res) => {
  res.send("all articles");
};

exports.createArticle = (req, res) => {
  console.log(req.user);
  res.send("create articles");
};
