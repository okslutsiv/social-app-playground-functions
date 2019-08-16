const express = require("express");

const screams = require("./screams");
const scream = require("./scream");
const login = require("./login");
const signup = require("./signup");
const user = require("./user");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/screams", screams);
router.use("/scream", scream);
router.use("/login", login);
router.use("/signup", signup);
router.use("/user", user);

module.exports = router;
