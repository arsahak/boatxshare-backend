const mongoose = require("mongoose");
const { Schema } = mongoose;

const boatListerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Boat title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Boat description is required"],
      trim: true,
    },

    // Structured Address
    address: {
      country: { type: String, required: true, trim: true },
      province: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
    },

    boatLength: {
      type: String,
      required: [true, "Boat length is required"],
    },

    boatPassengers: {
      type: String,
      required: [true, "Number of passengers is required"],
    },

    boatCaptain: {
      type: String,
      required: true,
    },

    boatAmenitiesList: {
      type: [String], // List of amenities
      default: [],
    },

    boatYear: {
      type: String,
      required: [true, "Boat manufacturing year is required"],
    },

    boatMake: {
      type: String,
      required: [true, "Boat make is required"],
      trim: true,
    },

    boatModel: {
      type: String,
      required: [true, "Boat model is required"],
      trim: true,
    },

    boatCapacity: {
      type: String,
      required: [true, "Boat capacity is required"],
    },

    boatType: {
      type: String,
      required: [true, "Boat type is required"],
      trim: true,
    },

    bookingOption: {
      type: [
        {
          duration: { type: String, required: true, trim: true }, 
          price: { type: String, required: true }, 
        },
      ],
      required: true,
    },

    boatFuel: {
      type: String,
      required: true,
    },

    featureImage: {
      type: String,
      required: true,
    },

    gallery: {
      type: [String], 
      validate: {
        validator: function (value) {
          return value.every((url) => /^https?:\/\/.*\.(png|jpg|jpeg|svg|webp)$/i.test(url));
        },
        message: "Gallery must contain valid image URLs",
      },
    },

    ratings: {
      type: Number,
      default: 0,
      min: [0, "Ratings cannot be negative"],
      max: [5, "Ratings cannot exceed 5"],
    },

    totalBooking: {
      type: Number,
      min: [0, "Booking cannot be negative"],
      default: 0,
    },

    boatLister: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Boat lister (User) is required"],
    },

    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String, trim: true },
        rating: {
          type: Number,
          min: [0, "Rating cannot be negative"],
          max: [5, "Rating cannot exceed 5"],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BoatLister", boatListerSchema);
