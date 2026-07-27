const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_VERSION = process.env.FRONTEND_VERSION || "v1";
const APP_ENV = process.env.APP_ENV || "dev";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

app.use(express.static(path.join(__dirname, "../public")));

app.get("/config", (req, res) => {
  res.json({
    frontendVersion: FRONTEND_VERSION,
    environment: APP_ENV,
    backendUrl: BACKEND_URL
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "coffee-shop-frontend"
  });
});

app.get("/ready", (req, res) => {
  res.json({
    status: "READY",
    service: "coffee-shop-frontend"
  });
});

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      message: "Frontend started",
      port: PORT,
      frontendVersion: FRONTEND_VERSION,
      environment: APP_ENV,
      backendUrl: BACKEND_URL
    })
  );
});