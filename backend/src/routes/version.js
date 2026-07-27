const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/api/version", (req, res) => {
  res.json({
    name: config.appName,
    version: config.appVersion,
    environment: config.appEnvironment,
    message: config.appMessage
  });
});

module.exports = router;