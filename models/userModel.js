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
      trim: true,
      minlength: [
        8,
        "The length of the user password must be at least 8 characters",
      ],
      set: function (value) {
        return bcrypt.hashSync(value, bcrypt.genSaltSync(10));
      },
    },

    image: {
      type: String,
    },

    address: {
      type: String,
      // required: [true, "User address is required"],
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
        default: false
      },
      listingRequestInfo: {
        question1: { type: String },
        question2: { type: String },
        question3: { type: String },
        question4: { type: String }
      }
    },

    isBanned: {
      type: Boolean,
      default: false,
    },


  },
  { timestamps: true }
);

const User = model("Users", userSchema);

module.exports = User;
