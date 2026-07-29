const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/admin/config", (req, res) => {
  res.json({
    appName: config.appName,
    appVersion: config.appVersion,
    appEnvironment: config.appEnvironment,
    appMessage: config.appMessage,
    failMode: config.failMode,
    secretConfigured: config.secretApiKey !== null,
    ordersFilePath: config.ordersFilePath
  });
});

module.exports = router;