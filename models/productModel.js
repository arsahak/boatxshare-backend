const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    regularPrice: {
      type: Number,
      required: [true, "Regular price is required"],
      min: [0, "Regular price must be a positive number"],
    },
    discountPrice: {
      type: Number,
      required: [true, "Discount price is required"],
      min: [0, "Discount price must be a positive number"],
      validate: {
        validator: function (value) {
          return value < this.regularPrice;
        },
        message: "Discount price must be less than the regular price",
      },
    },
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      min: [0, "Retail price must be a positive number"],
    },
    laborCost: {
      type: Number,
      required: [true, "Labor cost is required"],
    },
    shippingCost: {
      type: Number,
      required: [true, "Shipping cost is required"],
      min: [0, "Shipping cost must be a positive number"],
    },
    fabricAPrice: {
      type: Number,
      required: [true, "Fabric A price is required"],
    },
    fabricBPrice: {
      type: Number,
      required: [true, "Fabric B price is required"],
    },
    productCost: {
      type: Number,
      required: [true, "Product cost is required"],
    },
    // image: {
    //   type: String,
    //   required: [true, "Product image URL is required"],
    //   validate: {
    //     validator: function (value) {
    //       return /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp)$/i.test(value);
    //     },
    //     message: "Please enter a valid image URL",
    //   },
    // },
    // gallery: {
    //   type: [String], // Array of image URLs
    //   validate: {
    //     validator: function (value) {
    //       return value.every((url) =>
    //         /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp)$/i.test(url)
    //       );
    //     },
    //     message: "Gallery must contain valid image URLs",
    //   },
    // },
    articleNumber: {
      type: String,
      required: [true, "Product article number is required"],
      trim: true,
    },
    size: {
      type: String,
      required: [true, "Product size is required"],
    },
    colorCode: {
      type: String,
      required: [true, "Product color code is required"],
    },
    colorName: {
      type: String,
      required: [true, "Product color name is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [0, "Quantity must be at least 0"],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Sold quantity cannot be negative"],
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, "Shipping cost cannot be negative"],
    },
    // restockThreshold: {
    //   type: Number,
    //   default: 0,
    //   min: [0, "Restock threshold must be a positive number"],
    // },
    ratings: {
      type: Number,
      default: 0,
      min: [0, "Ratings cannot be negative"],
      max: [5, "Ratings cannot exceed 5"],
    },
    reviews: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          comment: { type: String, trim: true },
          rating: {
            type: Number,
            min: [0, "Rating cannot be negative"],
            max: [5, "Rating cannot exceed 5"],
          },
        },
      ],
    },
    variants: {
      type: [
        {
          size: String,
          colorCode: String,
          colorName: String,
          quantity: {
            type: Number,
            required: true,
            min: [0, "Variant quantity must be at least 0"],
          },
        },
      ],
    },
    tags: {
      type: [String],
      default: [],
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Product = model("Product", productSchema);

module.exports = Product;
