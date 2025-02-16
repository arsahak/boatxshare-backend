

const createError = require("http-errors");
const { successResponse } = require("./responseController");
const Order = require("../models/orderModel"); // Adjust the path based on your project structure


/**
 * @desc Create a new order
 * @route POST /api/orders
 * @access Public or Authenticated (based on your auth setup)
 */
const createOrder = async (req, res, next) => {
  try {
    const {boatDetails, duration, groupSize, baseCost, paymentServiceFee, totalFee, orderStatus, paymentStatus } = req.body;

    const user = req.user._id

    // Creating a new order
    const newOrder = new Order({
      user,
      boatDetails,
      duration,
      groupSize,
      baseCost,
      paymentServiceFee,
      totalFee,
      orderStatus,
      paymentStatus,
    });

    await newOrder.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Order created successfully",
      payload: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update an existing order
 * @route PUT /api/orders/:orderId
 * @access Authenticated (based on your auth setup)
 */
const updateOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find order and update with new data
    const updatedOrder = await Order.findByIdAndUpdate(orderId, req.body, { new: true });

    // if (!updatedOrder) {
    //   return res.status(404).json({ message: "Order not found" });
    // }

    return successResponse(res, {
      statusCode: 200,
      message: "Order updated successfully",
      payload: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all orders for a specific user
 * @route GET /api/orders/user/:userId
 * @access Authenticated (based on your auth setup)
 */
const getUserOrdersd = async (req, res, next) => {
  try {

    const { userId } = req.user._id;
    const { search = "", page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    // Search filter (case-insensitive regex search on orderStatus & paymentStatus)
    const searchFilter = search
      ? {
          $or: [
            { orderStatus: { $regex: search, $options: "i" } },
            { paymentStatus: { $regex: search, $options: "i" } },
          ],
        }
      : {};

      

    // Find orders with pagination
    const orders = await Order.find({ user: userId, ...searchFilter })
      .populate("boatDetails user")
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // Sort by latest orders

      console.log("check this order",orders);
      

    // Get total count for pagination metadata
    const totalOrders = await Order.countDocuments({ user: userId, ...searchFilter });

    return successResponse(res, {
      statusCode: 200,
      message: "Orders successfully retrieved",
      payload: {
        orders,
        pagination: {
          totalOrders,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalOrders / pageSize),
          pageSize,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Add a review for a boat listing
 * @route POST /api/reviews/:boatId
 * @access Authenticated
 */
const addReview = async (req, res, next) => {
  try {
    const { boatId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; // Assuming user is authenticated and added to req.user

    // Check if the user has a completed order for this boat
    const completedOrder = await Order.findOne({
      user: userId,
      boatDetails: boatId,
      orderStatus: "completed",
    });

    if (!completedOrder) {
      return errorResponse(res, {
        statusCode: 403,
        message: "You can only review boats you have booked and completed orders for.",
      });
    }

    // Find the boat listing
    const boat = await BoatLister.findById(boatId);
    if (!boat) {
      return errorResponse(res, { statusCode: 404, message: "Boat not found" });
    }

    // Check if the user has already left a review
    const existingReview = boat.reviews.find((review) => review.user.toString() === userId);
    if (existingReview) {
      return errorResponse(res, { statusCode: 400, message: "You have already reviewed this boat." });
    }

    // Add review to the boat
    boat.reviews.push({
      user: userId,
      rating,
      comment,
    });

    await boat.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Review added successfully",
      payload: boat.reviews,
    });
  } catch (error) {
    next(error);
  }
};


const getUserOrders = async (req, res, next) => {
  try {

    const user = req.user._id;

    // Parse query parameters
    const search = req.query.search?.trim() || "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    // Escape special characters in search input
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegExp = new RegExp(escapeRegExp(search), "i");

    let filter = {};

    // If search is provided, add the $or condition
    if (search) {
      filter.$or = [
        { paymentStatus: searchRegExp },
        { orderStatus: searchRegExp },

      ];
    }

    // Count total boats matching the filter
    const totalOrder= await Order.countDocuments(user, filter);

    if (totalOrder === 0) {
      return successResponse(res, {
        statusCode: 200,
        message: "No BoatLister found matching the search criteria.",
        payload: {
          order: [],
          pagination: {
            totalPages: 0,
            currentPage: 0,
            previousPage: null,
            nextPage: null,
          },
        },
      });
    }

    // Fetch boats with pagination and populate user data (excluding password)
    const orders = await Order.find(filter)
    .populate({
      path: "user boatDetails",
    })
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
  
    const totalPages = Math.ceil(totalOrder / limit);

    // Respond with the filtered and paginated data
    return successResponse(res, {
      statusCode: 200,
      message: "BoatLister details successfully returned.",
      payload: {
        orders,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve boatLister details."));
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getUserOrders,
  addReview
};
