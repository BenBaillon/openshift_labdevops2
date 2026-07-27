function log(message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    ...metadata
  };

  console.log(JSON.stringify(logEntry));
}

function error(message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    ...metadata
  };

  console.error(JSON.stringify(logEntry));
}

module.exports = {
  log,
  error
};