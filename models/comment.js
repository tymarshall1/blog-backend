const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const commentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minLength: 2,
  },

  comment: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Articles",
  },

  created: {
    type: Date,
    default: Date.now,
  },
});

postSchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.Model("Comments", commentSchema);
