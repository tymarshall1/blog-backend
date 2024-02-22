const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const articlesRouter = require("./routes/articles");

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
app.use("/api/user", usersRouter);
app.use("/api/articles", articlesRouter);

module.exports = app;
