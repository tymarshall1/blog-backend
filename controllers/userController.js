const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const auth = require("../middlewares/auth");
const jwt = require("jsonwebtoken");
// exports.createUser = (req, res) => {
//   var salt = bcrypt.genSaltSync(10);
//   var hash = bcrypt.hashSync("admin", salt);

//   const user = new User({
//     username: "tyler",
//     password: hash,
//   });

//   user.save().then(res.send("success!")).catch(res.send("error"));
// };

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
    .isLength({ min: 2 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.send("username or password not formatted correctly");
    else next();
  },
  auth.verifyLogin,
  (req, res) => {
    const { id, username } = req.user;
    const token = jwt.sign({ id, username }, process.env.JWT_SECRET);
    res.json({ token: token });
  },
];
