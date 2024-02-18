const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  articles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Articles",
    },
  ],

  joined: {
    type: Date,
    default: Date.now,
  },
});

postSchema.virtual("formattedDateJoined").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.Model("Users", userSchema);
