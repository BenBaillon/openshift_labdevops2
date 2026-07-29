const config = {
  appName: process.env.APP_NAME || "Coffee Shop Backend",
  appVersion: process.env.APP_VERSION || "v1",
  appEnvironment: process.env.APP_ENV || "dev",
  appMessage: process.env.APP_MESSAGE || "Hello from Coffee Shop Backend",
  port: process.env.PORT || 8080,

  failMode: process.env.FAIL_MODE === "true",

  secretApiKey: process.env.SECRET_API_KEY || null,

  ordersFilePath: process.env.ORDERS_FILE_PATH || "/tmp/orders.json"
};

module.exports = config;