const express = require("express");

const router = express.Router();

const products = [
  {
    id: 1,
    name: "Espresso",
    price: 2.5
  },
  {
    id: 2,
    name: "Latte",
    price: 3.8
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 4.2
  },
  {
    id: 4,
    name: "Mocha",
    price: 4.5
  }
];

router.get("/api/products", (req, res) => {
  res.json({
    count: products.length,
    items: products
  });
});

module.exports = router;