var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("home page");
});

module.exports = router;
