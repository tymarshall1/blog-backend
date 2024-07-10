const Community = require("../models/community");
const Comment = require("../models/comment");
const Post = require("../models/post");

exports.query = async (req, res) => {
  const { search } = req.query;
  if (search) {
    const searchRegex = new RegExp(search, "i");
    try {
      const communities = await Community.find({
        $or: [
          { tags: searchRegex },
          { name: searchRegex },
          { description: searchRegex },
        ],
      })
        .select("name communityIcon")
        .limit(10)
        .exec();

      const posts = await Post.find({
        $or: [{ title: searchRegex }, { body: searchRegex }],
      })
        .select("title author created community _id")
        .populate({
          path: "author",
          select: "-_id profileImg",
          populate: {
            path: "account",
            select: "-_id username",
          },
        })
        .populate({ path: "community", select: "name" })
        .limit(10)
        .exec();

      const comments = await Comment.find({
        comment: searchRegex,
      })
        .select("comment profile created post")
        .populate({
          path: "profile",
          select: "-_id profileImg",
          populate: {
            path: "account",
            select: "-_id username",
          },
        })
        .populate({
          path: "post",
          select: "title _id community",
          populate: { path: "community", select: "name" },
        })
        .limit(10)
        .exec();
      res.json({ communities: communities, posts: posts, comments: comments });
    } catch (err) {
      res.status(500).json({ error: "Server error, try again later." });
    }
  }
};
