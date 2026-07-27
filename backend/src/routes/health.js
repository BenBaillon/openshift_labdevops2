const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/health", (req, res) => {
  if (config.failMode) {
    return res.status(500).json({
      status: "KO",
      message: "Application is in fail mode"
    });
  }

  res.json({
    status: "OK",
    service: config.appName
  });
});

router.get("/ready", (req, res) => {
  if (config.failMode) {
    return res.status(503).json({
      status: "NOT_READY",
      message: "Application is not ready because FAIL_MODE=true"
    });
  }

  res.json({
    status: "READY",
    service: config.appName
  });
});

module.exports = router;