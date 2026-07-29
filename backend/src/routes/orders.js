const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const config = require("../config");
const logger = require("../logger");

const router = express.Router();

async function ensureOrdersFile() {
  const directory = path.dirname(config.ordersFilePath);

  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(config.ordersFilePath);
  } catch {
    await fs.writeFile(config.ordersFilePath, JSON.stringify([], null, 2));
  }
}

async function readOrders() {
  await ensureOrdersFile();

  const content = await fs.readFile(config.ordersFilePath, "utf-8");

  if (!content.trim()) {
    return [];
  }

  return JSON.parse(content);
}

async function writeOrders(orders) {
  await ensureOrdersFile();

  await fs.writeFile(
    config.ordersFilePath,
    JSON.stringify(orders, null, 2),
    "utf-8"
  );
}

router.get("/api/orders", async (req, res) => {
  try {
    const orders = await readOrders();

    res.json({
      count: orders.length,
      storagePath: config.ordersFilePath,
      items: orders
    });
  } catch (error) {
    logger.error("Unable to read orders", {
      error: error.message,
      ordersFilePath: config.ordersFilePath
    });

    res.status(500).json({
      error: "Unable to read orders",
      message: error.message
    });
  }
});

router.post("/api/orders", async (req, res) => {
  try {
    const orders = await readOrders();

    const order = {
      id: `order-${Date.now()}`,
      product: req.body.product || "Espresso",
      quantity: Number(req.body.quantity || 1),
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    await writeOrders(orders);

    logger.log("Order created", {
      orderId: order.id,
      product: order.product,
      quantity: order.quantity
    });

    res.status(201).json(order);
  } catch (error) {
    logger.error("Unable to create order", {
      error: error.message,
      ordersFilePath: config.ordersFilePath
    });

    res.status(500).json({
      error: "Unable to create order",
      message: error.message
    });
  }
});

router.delete("/api/orders", async (req, res) => {
  try {
    await writeOrders([]);

    logger.log("Orders cleared");

    res.json({
      status: "CLEARED",
      message: "All orders have been deleted"
    });
  } catch (error) {
    logger.error("Unable to clear orders", {
      error: error.message,
      ordersFilePath: config.ordersFilePath
    });

    res.status(500).json({
      error: "Unable to clear orders",
      message: error.message
    });
  }
});

module.exports = router;