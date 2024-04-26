const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const Profile = require("../models/profile");
const multer = require("multer");
const cloudinaryAPI = require("../apis/cloudinaryAPI");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.privateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await Profile.findById(user.profile);
    res.json({
      username: user.username,
      accountCreated: user.formattedDateJoined,
      profile,
    });
  } catch (err) {
    res.status(404).json({ error: "profile not found" });
  }
};

exports.publicUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const profile = await Profile.findById(user.profile);
    res.json({
      username: user.username,
      accountCreated: user.formattedDateJoined,
      profile,
    });
  } catch (err) {
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

      const userProfile = await Profile.findOneAndUpdate(
        {
          account: req.user.id,
        },
        {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          biography: req.body.biography,
          profileImg: cloudinaryUploadResponse.secure_url,
        },
        { new: true }
      );
      return res.json(userProfile);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "could not update profile." });
    }
  },
];
