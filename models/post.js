const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const User = require("./user");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minLength: 2,
  },

  body: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },

  published: {
    type: Boolean,
    default: false,
    required: true,
  },

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
    },
  ],

  created: {
    type: Date,
    default: Date.now,
  },
});

postSchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

postSchema.post("findOneAndDelete", async function (doc) {
  const postId = doc._id;

  await User.updateMany({ posts: postId }, { $pull: { posts: postId } });
});

postSchema.post("save", async function (doc) {
  const postId = doc._id;
  const authorId = doc.author;

  await User.findByIdAndUpdate(authorId, {
    $addToSet: { posts: postId },
  });
});

module.exports = mongoose.model("Posts", postSchema);
