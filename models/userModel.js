const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "User email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
        },
        message: "Please enter a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "User password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },

    image: {
      type: String,
    },

    address: {
      type: String,
    },

    phone: {
      type: String,
      required: [true, "User phone is required"],
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isBoatLister: {
      type: Boolean,
      default: false,
    },

    isBoatListerDetails: {
      listingRequest: {
        type: Boolean,
        default: false,
      },
      listingRequestInfo: {
        question1: { type: String },
        question2: { type: String },
        question3: { type: String },
        question4: { type: String },
      },
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },

    totalBooking: {
      type: Number,
      min: [0, "Booking cannot be negative"],
      default: 0,
    },

    responseRate: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = model("User", userSchema);

module.exports = User;
