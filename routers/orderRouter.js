const express = require("express");
const orderRouter = express.Router();

const {
  createOrder,
  getUserOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  handlePayment,
  addReview,
} = require("../controllers/orderController");
const { isLoggedIn } = require("../middleware/auth");

orderRouter.post("/orders", isLoggedIn, createOrder);
orderRouter.get("/orders", isLoggedIn, getUserOrders);
orderRouter.put("/orders/:id", updateOrder);
orderRouter.post("/orders/review", addReview);

module.exports ={ orderRouter};
