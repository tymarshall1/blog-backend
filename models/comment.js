const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Post = require("./post");
const Profile = require("./profile");
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

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Posts",
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
  const postId = doc.post;
  const profileId = doc.post.Profile._id;
  await Post.findByIdAndUpdate(postId, {
    $addToSet: { comments: commentId },
  });

  await Profile.findByIdAndUpdate(profileId, {
    $addToSet: { comments: commentId },
  });
});

commentSchema.post("findOneAndDelete", async function (doc) {
  const commentId = doc._id;
  const postId = doc.post;

  await Post.findByIdAndUpdate(postId, {
    $pull: { comments: commentId },
  });
});

module.exports = mongoose.model("Comments", commentSchema);
