const { body, validationResult } = require("express-validator");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Profile = require("../models/profile");
const Community = require("../models/community");
const { DateTime } = require("luxon");

exports.getPosts = async (req, res) => {
  async function findPosts(sortObject) {
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
      .sort(sortObject)
      .limit(25)
      .exec();

    return posts;
  }

  try {
    const { filter } = req.query;
    let posts;

    if (filter === "home") {
      posts = await findPosts({ created: -1 });
    } else if (filter === "popular") {
      posts = await findPosts({ likes: -1 });
    } else {
      posts = await findPosts({ created: -1 });
    }

    if (req.user) {
      const user = await Profile.findOne({ account: req.user.id });

      const finishedPosts = posts.map((post) => {
        const userLikesPost = user.likedPosts.includes(post._id);
        const userDislikesPost = user.dislikedPosts.includes(post._id);
        const reactionScore = userLikesPost ? 1 : userDislikesPost ? -1 : 0;
        return {
          _id: post._id,
          title: post.title,
          body: post.body,
          author: {
            _id: post.author._id,
            account: { username: post.author.account.username },
          },
          community: {
            name: post.community.name,
            communityIcon: post.community.communityIcon,
          },
          likes: post.numberOfLikes,
          dislikes: post.numberOfDislikes,
          comments: post.numberOfComments,
          created: post.created,
          reactionScore,
        };
      });
      res.json(finishedPosts);
    } else {
      const finishedPosts = posts.map((post) => {
        return {
          _id: post._id,
          title: post.title,
          body: post.body,
          author: {
            _id: post.author._id,
            account: { username: post.author.account.username },
          },
          community: {
            name: post.community.name,
            communityIcon: post.community.communityIcon,
          },
          likes: post.numberOfLikes,
          dislikes: post.numberOfDislikes,
          comments: post.numberOfComments,
          created: post.created,
        };
      });
      res.json(finishedPosts);
    }
  } catch (err) {
    console.log(err);
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
    const populateReplies = (depth = 6) => {
      if (depth === 0) return [];
      return [
        {
          path: "profile",
          select: "profileImg account -_id",
          populate: {
            path: "account",
            select: "username -_id",
          },
        },
        {
          path: "replies",
          select: "profile comment created replies likes dislikes",
          populate: populateReplies(depth - 1),
        },
      ];
    };

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
        select: "comment isReply likes dislikes replies profile created",
        populate: populateReplies(),
      })
      .exec();

    let user = null;
    if (req.user) {
      user = await Profile.findOne({ account: req.user.id });
    }

    const convertLikesDislikes = (comment) => {
      const likes = comment.likes || [];
      const dislikes = comment.dislikes || [];
      const replies = comment.replies || [];
      let reactionScore = 0;
      if (user) {
        const userLikesComment = user.likedComments.includes(comment._id);
        const userDislikesComment = user.dislikedComments.includes(comment._id);
        reactionScore = userLikesComment ? 1 : userDislikesComment ? -1 : 0;

        return {
          ...comment,
          likes: likes.length,
          dislikes: dislikes.length,
          replies: replies.map(convertLikesDislikes),
          reactionScore,
        };
      } else {
        return {
          ...comment,
          likes: likes.length,
          dislikes: dislikes.length,
          replies: replies.map(convertLikesDislikes),
        };
      }
    };

    const updatedPosts = { ...posts.toObject() };
    let reactionScore = 0;
    if (user) {
      const userLikesComment = user.likedPosts.includes(updatedPosts._id);
      const userDislikesComment = user.dislikedPosts.includes(updatedPosts._id);
      reactionScore = userLikesComment ? 1 : userDislikesComment ? -1 : 0;
    }

    updatedPosts.reactionScore = reactionScore;
    updatedPosts.likes = updatedPosts.likes.length;
    updatedPosts.dislikes = updatedPosts.dislikes.length;
    updatedPosts.comments = updatedPosts.comments.map(convertLikesDislikes);
    updatedPosts.community.followers = updatedPosts.community.followers.length;
    updatedPosts.community.created = DateTime.fromJSDate(
      updatedPosts.community.created,
      {
        zone: "America/New_York",
      }
    ).toLocaleString(DateTime.DATETIME_SHORT);

    res.json(updatedPosts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error finding posts" });
  }
};

exports.togglePostReaction = async (req, res) => {
  try {
    const profile = await Profile.findOne({ account: req.user.id });
    const post = await Post.findById(req.params.id);

    if (req.body.action === "TOGGLE_LIKE") {
      //already disliked
      if (profile.dislikedPosts.includes(post._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { dislikedPosts: post._id } }
        ).exec();
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { likedPosts: post._id } }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { dislikes: profile._id },
            $addToSet: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: 1,
        });
      }

      //already liked
      else if (profile.likedPosts.includes(post._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { likedPosts: post._id } }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: 0,
        });
      }

      //not liked or disliked
      else {
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { likedPosts: post._id } }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $addToSet: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: 1,
        });
      }
    }

    if (req.body.action === "TOGGLE_DISLIKE") {
      //already disliked
      if (profile.dislikedPosts.includes(post._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { dislikedPosts: post._id } }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: 0,
        });
      }

      //already liked
      else if (profile.likedPosts.includes(post._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          {
            $pull: { likedPosts: post._id },
            $addToSet: { dislikedPosts: post._id },
          }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { likes: profile._id },
            $addToSet: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: -1,
        });
      }

      //not liked or disliked
      else {
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { dislikedPosts: post._id } }
        ).exec();
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $addToSet: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedPost.numberOfLikes,
          dislikes: updatedPost.numberOfDislikes,
          reactionScore: -1,
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: "Server error, try again later." });
  }
};

exports.toggleCommentReaction = async (req, res) => {
  try {
    const profile = await Profile.findOne({ account: req.user.id });
    const comment = await Comment.findById(req.params.id);

    if (req.body.action === "TOGGLE_LIKE") {
      //already disliked
      if (profile.dislikedComments.includes(comment._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { dislikedComments: comment._id } }
        ).exec();
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { likedComments: comment._id } }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { dislikes: profile._id },
            $addToSet: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: 1,
        });
      }

      //already liked
      else if (profile.likedComments.includes(comment._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { likedComments: comment._id } }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: 0,
        });
      }

      //not liked or disliked
      else {
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { likedComments: comment._id } }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $addToSet: { likes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: 1,
        });
      }
    }

    if (req.body.action === "TOGGLE_DISLIKE") {
      //already disliked
      if (profile.dislikedComments.includes(comment._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          { $pull: { dislikedComments: comment._id } }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: 0,
        });
      }

      //already liked
      else if (profile.likedComments.includes(comment._id)) {
        await Profile.updateOne(
          { account: req.user.id },
          {
            $pull: { likedComments: comment._id },
            $addToSet: { dislikedComments: comment._id },
          }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { likes: profile._id },
            $addToSet: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: -1,
        });
      }

      //not liked or disliked
      else {
        await Profile.updateOne(
          { account: req.user.id },
          { $addToSet: { dislikedComments: comment._id } }
        ).exec();
        const updatedComment = await Comment.findByIdAndUpdate(
          req.params.id,
          {
            $addToSet: { dislikes: profile._id },
          },
          { new: true }
        ).exec();
        return res.json({
          likes: updatedComment.numberOfLikes,
          dislikes: updatedComment.numberOfDislikes,
          reactionScore: -1,
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: "Server error, try again later." });
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
  body("commendID", "").optional(),
  body("comment", "comment must be at least 2 characters long")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2 }),
  body("isReply", "Comment must be marked as to if they are replies or not.")
    .isBoolean()
    .notEmpty(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      res.status(400).json({ error: "Payload not formatted correctly." });
    } else {
      try {
        const userProfile = await Profile.findOne({ account: req.user.id });
        const { commentID, comment: userComment, isReply } = req.body;

        const comment = new Comment({
          profile: userProfile._id,
          comment: userComment,
          post: req.params.id,
          isReply: isReply,
        });

        await comment.save();
        await comment.populate({
          path: "profile",
          select: "profileImg -_id",
          populate: { path: "account", select: "username -_id" },
        });

        if (commentID) {
          await Comment.findByIdAndUpdate(commentID, {
            $addToSet: { replies: comment },
          }).exec();

          return res.json(comment);
        }

        res.json(comment);
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Couldn't save comment" });
      }
    }
  },
];

exports.commentThread = async (req, res) => {
  const populateReplies = (depth = 6) => {
    if (depth === 0) return [];
    return [
      {
        path: "profile",
        select: "profileImg account -_id",
        populate: {
          path: "account",
          select: "username -_id",
        },
      },
      {
        path: "replies",
        select: "profile comment created replies likes dislikes",
        populate: populateReplies(depth - 1),
      },
    ];
  };

  try {
    const comment = await Comment.findById(req.params.commentId)
      .populate({
        path: "profile",
        select: "profileImg account -_id",
        populate: {
          path: "account",
          select: "username -_id",
        },
      })
      .populate({
        path: "replies",
        select: "comment author created likes dislikes replies",
        populate: populateReplies(),
      })
      .exec();

    let user = null;
    if (req.user) {
      user = await Profile.findOne({ account: req.user.id });
    }

    const convertLikesDislikes = (comment) => {
      const likes = comment.likes || [];
      const dislikes = comment.dislikes || [];
      const replies = comment.replies || [];

      let reactionScore = 0;
      if (user) {
        const userLikesComment = user.likedComments.includes(
          comment._id.toString()
        );
        const userDislikesComment = user.dislikedComments.includes(
          comment._id.toString()
        );
        reactionScore = userLikesComment ? 1 : userDislikesComment ? -1 : 0;
      }

      return {
        _id: comment._id,
        profile: comment.profile,
        comment: comment.comment,
        author: comment.author,
        created: comment.created,
        likes: likes.length,
        dislikes: dislikes.length,
        replies: replies.map(convertLikesDislikes),
        reactionScore,
      };
    };

    const updatedComment = {
      _id: comment._id,
      profile: comment.profile,
      comment: comment.comment,
      author: comment.author,
      created: comment.created,
      likes: comment.likes.length,
      dislikes: comment.dislikes.length,
      replies: comment.replies.map(convertLikesDislikes),
      reactionScore: 0,
    };

    if (user) {
      const userLikesComment = user.likedComments.includes(
        comment._id.toString()
      );
      const userDislikesComment = user.dislikedComments.includes(
        comment._id.toString()
      );
      updatedComment.reactionScore = userLikesComment
        ? 1
        : userDislikesComment
        ? -1
        : 0;
    }

    res.json(updatedComment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error finding comments, try again later." });
  }
};

exports.removeComment = async (req, res) => {
  try {
    await Comment.findOneAndDelete(req.params.commentId);
    res.status(200).json({ message: "comment successfully deleted!" });
  } catch (err) {
    res.status(404).json({ message: "Couldn't delete comment" });
  }
};

exports.editPost = async (req, res) => {
  if (req.user) {
    try {
      const userProfile = await Profile.findOne({
        account: req.user.id,
      }).populate({ path: "account", select: "username" });
      const post = await Post.findById(req.params.id).populate({
        path: "author",
        select: "account",
        populate: { path: "account", select: "username" },
      });

      if (post.author.account.username === userProfile.account.username) {
        post.title = req.body.postTitle || post.title;
        post.body = req.body.postBody || post.content;

        await post.save();
        return res.json({ message: "Post Updated Successfully" });
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }
    } catch (err) {
      return res.status(500).json({
        error:
          "An error occurred while updating the post. Please try again later.",
        details: err.message,
      });
    }
  }

  return res.json({ error: "User was not found" });
};

exports.editComment = async (req, res) => {
  if (req.user) {
    try {
      const userProfile = await Profile.findOne({
        account: req.user.id,
      }).populate({ path: "account", select: "username" });

      const comment = await Comment.findById(req.body.commentID).populate({
        path: "profile",
        select: "account",
        populate: { path: "account", select: "username" },
      });

      if (comment.profile.account.username === userProfile.account.username) {
        comment.comment = req.body.editedComment || comment.comment;

        await comment.save();
        return res.json({ message: "Comment Updated Successfully" });
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }
    } catch (err) {
      return res.status(500).json({
        error:
          "An error occurred while updating the comment. Please try again later.",
        details: err.message,
      });
    }
  }

  return res.status(404).json({ error: "Comment was not found" });
};
