const { body, validationResult } = require("express-validator");
const multer = require("multer");
const cloudinaryAPI = require("../apis/cloudinaryAPI");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Community = require("../models/community");
const Profile = require("../models/profile");

exports.popularCommunities = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (limit > 20) {
    res.status(400).json({ error: "limit must be under 5" });
    return;
  }

  try {
    const skip = (page - 1) * limit;
    let followedCommunities = [];

    if (req.user) {
      const profile = await Profile.findOne({ account: req.user.id });
      if (profile) {
        followedCommunities = profile.followedCommunities;
      }
    }

    const popularCommunities = await Community.aggregate([
      {
        $project: {
          name: 1,
          communityIcon: 1,
          description: 1,
          communityBG: 1,
          followers: { $size: "$followers" },
          followsCommunity: {
            $in: ["$_id", followedCommunities],
          },
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
  upload.fields([
    { name: "communityIcon", maxCount: 1 },
    { name: "communityBG", maxCount: 1 },
  ]),
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
    const defaultLinks = [
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1719451063/Community%20Backgrounds/defaultNature1.jpg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1719451063/Community%20Backgrounds/defaultNature2.jpg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1719450600/Community%20Backgrounds/defaultSpace1.jpg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1719450600/Community%20Backgrounds/defaultSpace2.jpg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720554284/Community%20Icons/defaultOrange.svg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720553127/Community%20Icons/defaultGreen.svg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720554420/Community%20Icons/defaultPurple.svg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720553127/Community%20Icons/defaultBlue.svg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720554284/Community%20Icons/defaultRed.svg",
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1720554420/Community%20Icons/defaultYellow.svg",
    ];

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "There was an error with data formatting.",
        details: errors.array(),
      });
    }

    try {
      const { communityName } = req.body;
      const community = await Community.findOne({
        name: { $regex: new RegExp("^" + communityName + "$", "i") },
      }).exec();

      if (community) {
        return res.status(409).json({ error: "Community already exists." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Server error, try again later." });
    }

    req.choseDefaultCommunityBG = defaultLinks.includes(req.body.communityBG);
    req.choseDefaultCommunityIcon = defaultLinks.includes(
      req.body.communityIcon
    );
    if (req.choseDefaultCommunityIcon && req.choseDefaultCommunityBG) {
      return next();
    }

    if (req.files) {
      const { communityIcon, communityBG } = req.files;
      const file = communityIcon || communityBG;

      if (
        file &&
        acceptableImgTypes.includes(file[0].mimetype) &&
        file[0].size < 1048576
      ) {
        return next();
      } else {
        console.log(file);
        return res
          .status(400)
          .json({ error: "Image formatting is incorrect." });
      }
    } else {
      return next();
    }
  },

  async (req, res) => {
    try {
      const currentUser = await Profile.findOne({
        account: req.user.id,
      }).exec();

      let iconUrl = req.body.communityIcon;
      let bgUrl = req.body.communityBG;

      if (
        req.files &&
        req.files.communityIcon &&
        !req.choseDefaultCommunityIcon
      ) {
        const cloudinaryUploadResponse =
          await cloudinaryAPI.cloudinaryImgUpload(
            req.files.communityIcon[0].buffer,
            "Community Icons",
            [
              { crop: "fill", gravity: "auto" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ]
          );
        iconUrl = cloudinaryUploadResponse.secure_url;
      }

      if (req.files && req.files.communityBG && !req.choseDefaultCommunityBG) {
        const cloudinaryUploadResponse =
          await cloudinaryAPI.cloudinaryImgUpload(
            req.files.communityBG[0].buffer,
            "Community Backgrounds",
            [
              { crop: "fill", gravity: "auto" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ]
          );
        bgUrl = cloudinaryUploadResponse.secure_url;
      }

      const newCommunity = new Community({
        owner: currentUser.id,
        name: req.body.communityName,
        description: req.body.description,
        tags: req.body.tags,
        communityIcon: iconUrl,
        communityBG: bgUrl,
      });

      const community = await newCommunity.save();
      return res.json(community);
    } catch (err) {
      console.error(err);
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

    let followsCommunity = false;
    let profile;
    if (req.user) {
      profile = await Profile.findOne({ account: req.user.id });
      if (profile.followedCommunities.includes(community.id))
        followsCommunity = true;
    }

    const formattedCommunity = {
      name: community.name,
      followsCommunity,
      description: community.description,
      communityIcon: community.communityIcon,
      communityBG: community.communityBG,
      tags: community.tags,
      followers: community.followerCount,
      owner: community.owner.account.username,
      formattedDateCreated: community.formattedDateCreated,
      posts: community.posts.map((post) => {
        let reactionScore = 0;
        if (profile) {
          const userLikesPost = profile.likedPosts.includes(post._id);
          const userDislikesPost = profile.dislikedPosts.includes(post._id);
          reactionScore = userLikesPost ? 1 : userDislikesPost ? -1 : 0;
        }

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
          reactionScore,
        };
      }),
    };

    res.json(formattedCommunity);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error, try again later." });
  }
};

exports.getFollowedCommunities = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    const profile = await Profile.findOne({
      account: req.user.id,
    }).populate({ path: "followedCommunities", select: "name communityIcon" });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const followedCommunities = profile.followedCommunities;

    res.json({
      followedCommunities,
    });
  } catch (err) {
    console.error("Error fetching followed communities:", err);
    res.status(500).json({ error: "Server error, try again later" });
  }
};
