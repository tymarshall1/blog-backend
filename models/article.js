const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minLength: 2,
  },

  body: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },

  published: {
    type: Boolean,
    default: false,
    required: true,
  },

  comments: [
    {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Comments",
    },
  ],

  created: {
    type: Date,
    default: Date.now,
  },
});

articleSchema.virtual("formattedDateCreated").get(function () {
  return DateTime.fromJSDate(this.created, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.model("Articles", articleSchema);
