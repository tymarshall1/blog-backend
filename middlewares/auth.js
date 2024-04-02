const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.verifyLogin = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username }).exec();
    const hash = user.password;
    const successfulLogin = bcrypt.compareSync(password, hash);
    if (successfulLogin) {
      req.user = { id: user._id, username: user.username };
      next();
    } else {
      res.status(401).json({ error: "incorrect user or password" });
    }
  } catch (err) {
    res.status(404).json({ error: "could not find user" });
  }
};

exports.verifyUsernameNotTaken = async (req, res, next) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username: username }).exec();
    if (!user) {
      next();
    } else {
      res.status(409).json({ error: "username already taken" });
    }
  } catch (error) {
    res.status(500).json({ error: "failed to fetch user" });
  }
};

exports.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    jwt.verify(bearerToken, process.env.JWT_SECRET, function (err, decoded) {
      if (err) res.send("error verifying token");
      else {
        req.user = decoded;
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
};
