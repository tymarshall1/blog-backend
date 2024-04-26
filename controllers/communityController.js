const { body, validationResult } = require("express-validator");
const multer = require("multer");
const cloudinaryAPI = require("../apis/cloudinaryAPI");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Community = require("../models/community");
const Profile = require("../models/profile");
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

      const cloudinaryUploadResponse = await cloudinaryAPI.cloudinaryImgUpload(
        req.file.buffer,
        "Community Icons"
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
