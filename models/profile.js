const mongoose = require("mongoose");
const profileSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  firstName: {
    type: String,
    required: false,
    trim: true,
    minLength: 1,
    default: "Unknown",
  },

  lastName: {
    type: String,
    required: false,
    trim: true,
    minLength: 1,
    default: "Unknown",
  },

  biography: {
    type: String,
    required: false,
    trim: true,
    default: "",
  },

  profileImg: {
    type: String,
    required: true,
    default:
      "https://res.cloudinary.com/de7we6c9g/image/upload/v1713806008/Profile%20Pictures/default.jpg",
  },

  ownedCommunities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Communities",
    },
  ],

  followedCommunities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Communities",
    },
  ],

  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
    },
  ],

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
    },
  ],

  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
    },
  ],
});

module.exports = mongoose.model("Profile", profileSchema);
