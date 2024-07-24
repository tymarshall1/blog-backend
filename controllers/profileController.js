const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const Profile = require("../models/profile");
const Community = require("../models/community");
const multer = require("multer");
const cloudinaryAPI = require("../apis/cloudinaryAPI");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.privateUserProfile = async (req, res) => {
  console.log("herte");
  try {
    const user = await User.findById(req.user.id);
    const profile = await Profile.findById(user.profile)
      .populate(
        "followedCommunities firstName lastName biography posts comments profileImg"
      )
      .exec();

    const formattedUserProfile = {
      ...profile.toObject(),
      likedPosts: profile.likedPosts.length,
      dislikedPosts: profile.dislikedPosts.length,
      likedComments: profile.likedComments.length,
      dislikedComments: profile.dislikedComments.length,
      followedCommunities: profile.followedCommunities.length,
      posts: profile.posts.length,
      ownedCommunities: profile.ownedCommunities.length,
      comments: profile.comments.length,
    };

    res.json({
      username: user.username,
      accountCreated: user.formattedDateJoined,
      profile: formattedUserProfile,
    });
  } catch (err) {
    res.status(404).json({ error: "profile not found" });
  }
};

exports.publicUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: { $regex: new RegExp("^" + req.params.username + "$", "i") },
    });
    const profile = await Profile.findById(user.profile)
      .populate({
        path: "ownedCommunities",
        select: "name communityIcon -_id",
      })
      .populate({
        path: "posts",
        select: "title community created body likes dislikes comments",
        options: { sort: { created: -1 } },
        populate: { path: "community", select: "name communityIcon" },
      })
      .populate({ path: "followedCommunities", select: "name -_id" })
      .populate({
        path: "comments",
        select: "comment post created post -_id",
        options: { sort: { created: -1 } },
        populate: {
          path: "post",
          select: "title community",
          populate: { path: "community", select: "name communityIcon -_id" },
        },
      })
      .populate({ path: "saved", select: "title" })
      .exec();

    const updatedProfile = { ...profile.toObject() };
    //also need to take out some of the fields being returned

    if (req.user) {
      const user = await Profile.findOne({ account: req.user.id });
      const mappedProfilePosts = profile.posts.map((post) => {
        const userLikesPost = user.likedPosts.includes(post._id);
        const userDislikesPost = user.dislikedPosts.includes(post._id);
        const reactionScore = userLikesPost ? 1 : userDislikesPost ? -1 : 0;
        return {
          _id: post._id,
          title: post.title,
          body: post.body,
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
      updatedProfile.posts = mappedProfilePosts;

      res.json({
        username: user.username,
        accountCreated: user.formattedDateJoined,
        profile: updatedProfile,
      });
    } else {
      const mappedProfilePosts = profile.posts.map((post) => {
        return {
          _id: post._id,
          title: post.title,
          body: post.body,
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
      updatedProfile.posts = mappedProfilePosts;

      res.json({
        username: user.username,
        accountCreated: user.formattedDateJoined,
        profile: updatedProfile,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ error: "profile not found" });
  }
};

exports.updateUserProfile = [
  upload.single("profileImg"),
  body(
    "firstName",
    "first name must not be empty and have a minimum length of 1 character"
  )
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 }),
  body(
    "lastName",
    "last name must not be empty and have a minimum length of 1 character"
  )
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 }),
  body("biography", "biography must be a string")
    .isString()
    .trim()
    .isLength({ max: 450 }),

  (req, res, next) => {
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

    if (
      req.file &&
      acceptableImgTypes.includes(req.file.mimetype) &&
      req.file.size < 1048576
    ) {
      next();
    } else {
      res.status(400).json({ error: "image formatting is incorrect." });
    }
  },

  async (req, res) => {
    try {
      const currentUser = await Profile.find({
        account: req.user.id,
      }).exec();
      const oldImgUrl = currentUser[0].profileImg;

      await cloudinaryAPI.cloudinaryImgDestroy(oldImgUrl, "Profile Pictures");

      const cloudinaryUploadResponse = await cloudinaryAPI.cloudinaryImgUpload(
        req.file.buffer,
        "Profile Pictures"
      );

      const updatedProfileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        biography: req.body.biography,
        profileImg: cloudinaryUploadResponse.secure_url,
      };

      const updatedUserProfile = await Profile.findOneAndUpdate(
        { account: req.user.id },
        updatedProfileData,
        { new: true }
      ).populate("firstName lastName biography posts comments profileImg");

      const formattedUserProfile = {
        ...updatedUserProfile.toObject(),
        likedPosts: updatedUserProfile.likedPosts.length,
        dislikedPosts: updatedUserProfile.dislikedPosts.length,
        likedComments: updatedUserProfile.likedComments.length,
        dislikedComments: updatedUserProfile.dislikedComments.length,
        followedCommunities: updatedUserProfile.followedCommunities.length,
        posts: updatedUserProfile.posts.length,
        ownedCommunities: updatedUserProfile.ownedCommunities.length,
        comments: updatedUserProfile.comments.length,
      };
      return res.json(formattedUserProfile);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "could not update profile." });
    }
  },
];

exports.toggleCommunityFollow = async (req, res) => {
  const userProfile = await Profile.findOne({ account: req.user.id });
  const community = await Community.findOne({
    name: req.body.followedCommunities,
  });

  if (userProfile.followedCommunities.includes(community._id)) {
    try {
      const updatedUser = await Profile.findOneAndUpdate(
        { account: req.user.id },
        { $pull: { followedCommunities: community._id } },
        { new: true }
      )
        .populate("followedCommunities")
        .exec();
      await Community.findOneAndUpdate(
        {
          name: req.body.followedCommunities,
        },
        { $pull: { followers: userProfile._id } }
      );
      res.json({
        followed: false,
        community: community.name,
        followedCommunities: updatedUser.followedCommunities,
      });
      return;
    } catch (err) {
      res.status(500).json({ error: "Server error, try again later." });
      return;
    }
  }
  try {
    const updatedUser = await Profile.findOneAndUpdate(
      { account: req.user.id },
      { $push: { followedCommunities: community._id } },
      { new: true }
    )
      .populate("followedCommunities")
      .exec();
    await Community.findOneAndUpdate(
      {
        name: req.body.followedCommunities,
      },
      { $push: { followers: userProfile._id } }
    );
    res.json({
      followed: true,
      community: community.name,
      followedCommunities: updatedUser.followedCommunities,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};
