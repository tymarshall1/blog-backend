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
