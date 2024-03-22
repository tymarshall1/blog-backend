const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Article = require("./post");

const commentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minLength: 2,
  },

  comment: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Articles",
  },

  created: {
    type: Date,
    default: Date.now,
  },
});

commentSchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

commentSchema.post("save", async function (doc) {
  const commentId = doc._id;
  const articleId = doc.article;

  await Article.findByIdAndUpdate(articleId, {
    $addToSet: { comments: commentId },
  });
});

commentSchema.post("findOneAndDelete", async function (doc) {
  const commentId = doc._id;
  const articleId = doc.article;

  await Article.findByIdAndUpdate(articleId, {
    $pull: { comments: commentId },
  });
});

module.exports = mongoose.model("Comments", commentSchema);
