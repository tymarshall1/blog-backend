const { body, validationResult } = require("express-validator");
const multer = require("multer");
const cloudinaryAPI = require("../apis/cloudinaryAPI");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Community = require("../models/community");
const Profile = require("../models/profile");

exports.popularCommunities = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  if (limit > 5) {
    res.status(400).json({ error: "limit must be under 5" });
    return;
  }

  try {
    const skip = (page - 1) * limit;

    const popularCommunities = await Community.aggregate([
      {
        $project: {
          _id: 0,
          name: 1,
          communityIcon: 1,
          followers: { $size: "$followers" },
        },
      },
      {
        $sort: { followers: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    res.json(popularCommunities);
  } catch (err) {
    res.status(500).json({ error: "Server error, try again later." });
  }
};

exports.createCommunity = [
  upload.single("communityIcon"),
  body(
    "communityName",
    "Community name must be between 1 and 15 characters long."
  )
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 15 })
    .escape(),
  body("description", "Description must be between 2 and 300 characters long.")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 2, max: 300 }),
  body("tags", "tags must be a string array").optional().isArray(),

  async (req, res, next) => {
    const errors = validationResult(req);
    const acceptableImgTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/svg+xml",
    ];

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ error: "There was an error with data formatting." });
      return;
    }

    try {
      const { communityName } = req.body;
      const community = await Community.findOne({
        name: { $regex: new RegExp("^" + communityName + "$", "i") },
      }).exec();

      if (community) {
        res.status(409).json({ error: "Community already exists." });
        return;
      }
    } catch (err) {
      res.status(500).json({ error: "Server error, try again later." });
    }

    if (
      req.file &&
      acceptableImgTypes.includes(req.file.mimetype) &&
      req.file.size < 1048576
    ) {
      next();
    } else {
      res.status(400).json({ error: "Image formatting is incorrect." });
    }
  },

  async (req, res) => {
    try {
      const currentUser = await Profile.find({
        account: req.user.id,
      }).exec();

      const cloudinaryUploadResponse = await cloudinaryAPI.cloudinaryImgUpload(
        req.file.buffer,
        "Community Icons",
        [
          { crop: "fill", gravity: "auto" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ]
      );

      const newCommunity = new Community({
        owner: currentUser[0].id,
        name: req.body.communityName,
        description: req.body.description,
        tags: req.body.tags,
        communityIcon: cloudinaryUploadResponse.secure_url,
      });

      const community = await newCommunity.save();
      res.json(community);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "could not create community." });
    }
  },
];

exports.getCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({
      name: { $regex: new RegExp("^" + req.params.communityName + "$", "i") },
    })
      .populate({
        path: "posts",
        select: "title body likes dislikes comments created author",
        options: { sort: { created: -1 } },
        populate: {
          path: "author",
          select: "profile profileImg -_id",
          populate: { path: "account", select: "username -_id" },
        },
      })
      .populate({
        path: "owner",
        select: "profile -_id",
        populate: { path: "account", select: "username -_id" },
      })
      .exec();
    if (!community) {
      res.status(404).json({ error: "Community not found." });
      return;
    }
    const formattedCommunity = {
      name: community.name,
      description: community.description,
      communityIcon: community.communityIcon,
      tags: community.tags,
      followers: community.followerCount,
      owner: community.owner.account.username,
      formattedDateCreated: community.formattedDateCreated,
      posts: community.posts.map((post) => {
        return {
          id: post._id,
          title: post.title,
          body: post.body,
          likes: post.numberOfLikes,
          dislikes: post.numberOfDislikes,
          comments: post.numberOfComments,
          created: post.created,
          username: post.author.account.username,
          profileImg: post.author.profileImg,
        };
      }),
    };

    res.json(formattedCommunity);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error, try again later." });
  }
};
