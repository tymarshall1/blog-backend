const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

mongoose.set("strictQuery", false);
const mongoDB = process.env.DB_CONNECTION;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB, {
    dbName: "blog",
  });
}

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

module.exports = app;
