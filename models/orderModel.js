const mongoose = require("mongoose");
const { Schema } = mongoose;


const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    boatDetails: {
      type: Schema.Types.ObjectId,
      ref: "BoatLister",
      required: [true, "Boat lister data is required"],
    },

    duration: {
      startDate: { type: Date,  },
      endDate: { type: Date,  },
      totalDays: { type: Number, },
    },

    groupSize: {  
      type: Number,
      default: 1,
      min: [1, "Group size must be at least 1"],
    },

    baseCost: { 
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },

    paymentServiceFee: { 
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },

    totalFee: { 
      type: Number,
      default: 0,
      min: [0, "Total fee cannot be negative"],
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "canceled", "completed"],
      default: "pending",
      required: [true, "Order status is required"],
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      required: [true, "Payment status is required"],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Order", orderSchema);
