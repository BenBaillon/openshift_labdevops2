const express = require("express");
const cors = require("cors");

const config = require("./config");
const logger = require("./logger");

const healthRoutes = require("./routes/health");
const productsRoutes = require("./routes/products");
const versionRoutes = require("./routes/version");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.log("Incoming request", {
    method: req.method,
    path: req.path
  });
  next();
});

app.get("/", (req, res) => {
  res.json({
    service: config.appName,
    version: config.appVersion,
    environment: config.appEnvironment,
    message: config.appMessage
  });
});

app.use(healthRoutes);
app.use(productsRoutes);
app.use(versionRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path
  });
});

app.listen(config.port, () => {
  logger.log("Backend started", {
    appName: config.appName,
    version: config.appVersion,
    environment: config.appEnvironment,
    port: config.port,
    failMode: config.failMode,
    secretConfigured: config.secretApiKey !== null
  });
});