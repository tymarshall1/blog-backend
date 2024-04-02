const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const auth = require("../middlewares/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.createUser = [
  body("username", "Invalid username")
    .notEmpty()
    .trim()
    .isString()
    .isLength({ min: 2 })
    .escape(),
  body("password", "Invalid password")
    .notEmpty()
    .trim()
    .isString()
    .isLength({ min: 5 })
    .escape(),
  body("confirmPassword", "Invalid password")
    .notEmpty()
    .trim()
    .isString()
    .isLength({ min: 5 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res
        .status(400)
        .json({ error: "username or password not formatted correctly" });
    else next();
  },
  auth.verifyUsernameNotTaken,
  async (req, res, next) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const user = new User({
      username: req.body.username,
      password: hash,
    });
    try {
      const newUser = await user.save();
      const userID = newUser._id;
      const token = jwt.sign({ userID }, process.env.JWT_SECRET);
      res.json({ token: token });
    } catch (error) {
      res.status(500).json({ error: "unable to save user" });
    }
  },
];

exports.loginUser = [
  body("username", "Invalid username")
    .notEmpty()
    .trim()
    .isString()
    .isLength({ min: 2 })
    .escape(),
  body("password", "Invalid password")
    .notEmpty()
    .trim()
    .isString()
    .isLength({ min: 5 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.json({ error: "username or password not formatted correctly" });
    else next();
  },
  auth.verifyLogin,
  (req, res) => {
    const { id } = req.user;
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    res.json({ token: token });
  },
];