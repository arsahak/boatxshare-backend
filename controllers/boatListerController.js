const BoatLister = require("../models/boatListerModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");

// Get all boat listings with search by title and address
const getAllBoats = async (req, res, next) => {
  try {
    const { title, country, province, city, page = 1, limit = 9} = req.query;

    // Convert page and limit to numbers, ensuring minimum values
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));

    // Escape special characters for regex search
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let filter = {};

    if (title) {
      filter.title = { $regex: escapeRegExp(title), $options: "i" };
    }
    if (country) {
      filter["address.country"] = { $regex: escapeRegExp(country), $options: "i" };
    }
    if (province) {
      filter["address.province"] = { $regex: escapeRegExp(province), $options: "i" };
    }
    if (city) {
      filter["address.city"] = { $regex: escapeRegExp(city), $options: "i" };
    }

    // Get total count of boats matching the filter
    const totalBoats = await BoatLister.countDocuments(filter);

    // If no boats found, return empty response
    if (totalBoats === 0) {
      return successResponse(res, {
        statusCode: 200,
        message: "No boats found matching the search criteria.",
        payload: {
          boats: [],
          pagination: {
            totalPages: 0,
            currentPage: 0,
            previousPage: null,
            nextPage: null,
          },
        },
      });
    }

    // Fetch paginated boats sorted by latest updated
    const boats = await BoatLister.find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ updatedAt: -1 })
      .exec();

    const totalPages = Math.ceil(totalBoats / limitNum);

    return successResponse(res, {
      statusCode: 200,
      message: "Boats retrieved successfully",
      payload: {
        boats,
        pagination: {
          totalPages,
          currentPage: pageNum,
          previousPage: pageNum > 1 ? pageNum - 1 : null,
          nextPage: pageNum < totalPages ? pageNum + 1 : null,
        },
      },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve boats."));
  }
};


// Create a new boat listing
const createBoat = async (req, res, next) => {
  try {
    // Destructure request body
    const {
      title,
      description,
      address,
      boatLength,
      boatPassengers,
      boatCaptain,
      boatAmenitiesList,
      boatYear,
      boatMake,
      boatModel,
      boatCapacity,
      boatType,
      bookingOption,
      boatFuel,
      gallery,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !description || !address?.country || !address?.city || !boatLength || !boatPassengers || !boatMake || !boatModel || !boatType || !boatCapacity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate and format booking options
    const formattedBookingOption = Array.isArray(bookingOption)
      ? bookingOption
          .filter(option => option?.duration && option?.price) // Ensure valid objects
          .map(option => ({ duration: option.duration.trim(), price: option.price }))
      : [];

      // if (!req.files || req.files.length === 0) {
      //   return res.status(400).json({ message: "No files uploaded" });
      // }

     
    if (gallery && !gallery.every(url => /^https?:\/\/.*\.(png|jpg|jpeg|svg|webp)$/i.test(url))) {
      return res.status(400).json({ success: false, message: "Invalid image URLs in the gallery." });
    }

    // Creating a new boat listing
    const newBoat = new BoatLister({
      title: title.trim(),
      description: description.trim(),
      address: {
        country: address.country.trim(),
        province: address.province?.trim() || "",
        city: address.city.trim(),
      },
      boatLength: boatLength.trim(),
      boatPassengers: boatPassengers.trim(),
      boatCaptain: boatCaptain.trim(), // Ensure it's a string
      boatAmenitiesList: Array.isArray(boatAmenitiesList) ? boatAmenitiesList.map(item => item.trim()) : [],
      boatYear: boatYear.trim(),
      boatMake: boatMake.trim(),
      boatModel: boatModel.trim(),
      boatCapacity: boatCapacity.trim(),
      boatType: boatType.trim(),
      bookingOption: formattedBookingOption,
      boatFuel: boatFuel.trim(), // Ensure it's a string
      gallery: Array.isArray(gallery) ? gallery : [],
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
    });

    await newBoat.save();

    return res.status(201).json({
      success: true,
      message: "Boat successfully listed",
      payload: newBoat,
    });
  } catch (error) {
    console.error("Error creating boat listing:", error);
    next(error);
  }
};



// Update a boat listing
const updateBoat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.image = req.file.path; // Cloudinary URL
    }

    const updatedBoat = await BoatLister.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("category", "name slug");

    if (!updatedBoat) {
      throw createError(404, "Boat not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Boat successfully updated",
      payload: updatedBoat,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a boat listing
const deleteBoat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBoat = await BoatLister.findByIdAndDelete(id);

    if (!deletedBoat) {
      throw createError(404, "Boat not found");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Boat successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBoats, createBoat, updateBoat, deleteBoat };
