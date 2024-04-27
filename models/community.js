const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Profile = require("../models/profile");
const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 15,
  },
  description: {
    type: String,
    trim: true,
    required: true,
    minLength: 2,
    maxLength: 300,
  },
  communityIcon: {
    type: String,
    required: true,
    default: "",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
    },
  ],
  tags: {
    type: [String],
    default: [],
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

communitySchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

communitySchema.post("save", async function (doc) {
  const communityID = doc._id;
  const ownerId = doc.owner;

  await Profile.findByIdAndUpdate(ownerId, {
    $addToSet: { ownedCommunities: communityID },
  });
});

module.exports = mongoose.model("Communities", communitySchema);
