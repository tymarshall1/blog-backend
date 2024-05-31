const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const User = require("./user");
const Profile = require("./profile");
const Community = require("./community");
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
  },

  body: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
  },

  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Communities",
    required: true,
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  ],

  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  ],

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

postSchema.virtual("numberOfLikes").get(function () {
  return this.likes.length;
});

postSchema.virtual("numberOfDislikes").get(function () {
  return this.dislikes.length;
});

postSchema.virtual("numberOfComments").get(function () {
  return this.comments.length;
});

postSchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

postSchema.post("findOneAndDelete", async function (doc) {
  const postId = doc._id;

  await Profile.updateMany({ posts: postId }, { $pull: { posts: postId } });
});

postSchema.post("save", async function (doc) {
  const postId = doc._id;
  const authorId = doc.author;
  const communityId = doc.community;

  await Profile.findByIdAndUpdate(authorId, {
    $addToSet: { posts: postId },
  });

  await Community.findByIdAndUpdate(communityId, {
    $addToSet: { posts: postId },
  });
});

module.exports = mongoose.model("Posts", postSchema);
