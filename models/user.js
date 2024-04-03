const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Profile = require("./profile");
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

  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },

  joined: {
    type: Date,
    default: Date.now,
  },
});

userSchema.virtual("formattedDateJoined").get(function () {
  return DateTime.fromJSDate(this.joined, {
    zone: "America/New_York",
  }).toLocaleString(DateTime.DATETIME_SHORT);
});

userSchema.post("save", async function (doc) {
  if (!doc.profile) {
    try {
      const profile = new Profile({ account: doc._id });
      await profile.save();
      doc.profile = profile._id;
      await doc.save();
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  }
});
module.exports = mongoose.model("Users", userSchema);
