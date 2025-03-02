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
  createPaymentIntents,
} = require("../controllers/orderController");
const { isLoggedIn } = require("../middleware/auth");

orderRouter.post("/orders", isLoggedIn, createOrder);
orderRouter.get("/orders", isLoggedIn, getUserOrders);
orderRouter.put("/orders/:id", updateOrder);
orderRouter.post("/orders/review", addReview);

orderRouter.post("/create-payment-intent", createPaymentIntents);

module.exports ={ orderRouter};
