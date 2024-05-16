const { body, validationResult } = require("express-validator");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Profile = require("../models/profile");
const Community = require("../models/community");
const { DateTime } = require("luxon");
exports.allPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate({
        path: "author",
        select: "_id",
        populate: {
          path: "account",
          select: "username -_id",
        },
      })
      .populate({ path: "community", select: "name communityIcon -_id" })
      .populate({
        path: "comments",
        select: "comment",
      })
      .exec();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "error finding posts" });
  }
};

exports.createPost = [
  body("communityName", "posts must have a valid community name.")
    .notEmpty()
    .isString()
    .trim(),

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

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: "Payload not formatted correctly." });
    } else {
      try {
        const userProfile = await Profile.findOne({ account: req.user.id });
        const community = await Community.findOne({
          name: req.body.communityName,
        });
        const newPost = new Post({
          title: req.body.title,
          body: req.body.body,
          author: userProfile._id,
          community: community._id,
        });
        await newPost.save();

        res.json({
          title: newPost.title,
          communityName: community.name,
          id: newPost._id,
        });
      } catch (err) {
        res.status(500).json({ error: "Server error, try again later." });
        return;
      }
    }
  },
];

exports.singlePost = async (req, res) => {
  try {
    const posts = await Post.findById(req.params.id)
      .populate({
        path: "author",
        select: "_id",
        populate: {
          path: "account",
          select: "username -_id",
        },
      })
      .populate({
        path: "community",
        select:
          "name communityIcon followers tags description owner created -_id",
      })
      .populate({
        path: "comments",
        select: "comment profile created -_id",
        populate: {
          path: "profile",
          select: "profileImg account -_id",
          populate: { path: "account", select: "username -_id" },
        },
      })
      .exec();

    const updatedPosts = { ...posts.toObject() };
    updatedPosts.community.followers = updatedPosts.community.followers.length;
    updatedPosts.community.created = DateTime.fromJSDate(
      updatedPosts.community.created,
      {
        zone: "America/New_York",
      }
    ).toLocaleString(DateTime.DATETIME_SHORT);

    res.json(updatedPosts);
  } catch (err) {
    res.status(500).json({ error: "error finding posts" });
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
        const article = await Post.findByIdAndUpdate(
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
    await Post.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: `Article ${req.params.id} was deleted successfully` });
  } catch (err) {
    res.status(404).json({ error: "unable to find article" });
  }
};

exports.comment = [
  body("comment", "comment must be at least 2 characters long")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.status(400).json({ error: "Payload not formatted correctly." });
    else {
      try {
        const userProfile = await Profile.findOne({ account: req.user.id });
        const comment = new Comment({
          profile: userProfile._id,
          comment: req.body.comment,
          post: req.params.id,
        });
        await comment.save();
        await comment.populate({
          path: "profile",
          select: "profileImg -_id",
          populate: { path: "account", select: "username -_id" },
        });
        res.json(comment);
      } catch (err) {
        console.log(err);
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
