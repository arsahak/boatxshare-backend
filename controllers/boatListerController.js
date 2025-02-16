const BoatLister = require("../models/boatListerModel");
const User = require("../models/userModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");


// const getAllBoats = async (req, res, next) => {
//   try {
//     const { boatPassengers, location, travelDuration, page = 1, limit = 9 } = req.query;

//     // Convert page and limit to numbers, ensuring minimum values
//     const pageNum = Math.max(1, parseInt(page, 10));
//     const limitNum = Math.max(1, parseInt(limit, 10));

//     // Escape special characters for regex search
//     const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//     let filter = {};

//     // Passenger Filtering (10 or greater)
//     if (boatPassengers) {
//       const passengers = parseInt(boatPassengers, 10);
//       filter.maxPassengers = passengers > 10 ? { $gte: 10 } : passengers;
//     }

//     // Location Filtering (Country → Province → City)
//     if (location) {
//       const countryFilter = { "address.country": { $regex: escapeRegExp(location), $options: "i" } };
//       const provinceFilter = { "address.province": { $regex: escapeRegExp(location), $options: "i" } };
//       const cityFilter = { "address.city": { $regex: escapeRegExp(location), $options: "i" } };

//       // Try finding boats in the country
//       let totalBoats = await BoatLister.countDocuments(countryFilter);
//       if (totalBoats === 0) {
//         // If no boats in country, try province
//         totalBoats = await BoatLister.countDocuments(provinceFilter);
//         if (totalBoats === 0) {
//           // If no boats in province, try city
//           totalBoats = await BoatLister.countDocuments(cityFilter);
//           if (totalBoats === 0) {
//             // If no boats in country, province, or city, return empty result
//             return successResponse(res, {
//               statusCode: 200,
//               message: "No boats found matching the search criteria.",
//               payload: {
//                 boats: [],
//                 pagination: {
//                   totalPages: 0,
//                   currentPage: 0,
//                   previousPage: null,
//                   nextPage: null,
//                 },
//               },
//             });
//           }
//           filter = cityFilter;
//         } else {
//           filter = provinceFilter;
//         }
//       } else {
//         filter = countryFilter;
//       }
//     }

//     // Get total count of boats matching the filter
//     const totalBoats = await BoatLister.countDocuments(filter);

//     // Fetch paginated boats sorted by latest updated
//     const boats = await BoatLister.find(filter)
//       .limit(limitNum)
//       .skip((pageNum - 1) * limitNum)
//       .sort({ updatedAt: -1 })
//       .exec();

//     const totalPages = Math.ceil(totalBoats / limitNum);

//     return successResponse(res, {
//       statusCode: 200,
//       message: "Boats retrieved successfully",
//       payload: {
//         boats,
//         pagination: {
//           totalPages,
//           currentPage: pageNum,
//           previousPage: pageNum > 1 ? pageNum - 1 : null,
//           nextPage: pageNum < totalPages ? pageNum + 1 : null,
//         },
//       },
//     });
//   } catch (error) {
//     next(createError(500, error.message || "Failed to retrieve boats."));
//   }
// };


const getAllBoats = async (req, res, next) => {
  try {
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
        { "address.country": searchRegExp },
        { "address.province": searchRegExp },
        { "address.city": searchRegExp },
      ];
    }

    // Count total boats matching the filter
    const totalBoatLister = await BoatLister.countDocuments(filter);

    if (totalBoatLister === 0) {
      return successResponse(res, {
        statusCode: 200,
        message: "No BoatLister found matching the search criteria.",
        payload: {
          boatLister: [],
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
    const boatLister = await BoatLister.find(filter)
    .populate({
      path: "boatLister",
    })
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
  
    const totalPages = Math.ceil(totalBoatLister / limit);

    // Respond with the filtered and paginated data
    return successResponse(res, {
      statusCode: 200,
      message: "BoatLister details successfully returned.",
      payload: {
        boatLister,
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



const getAllBoatsddd = async (req, res, next) => {
  try {
    const { boatPassengers, country, province, city, page = 1, limit = 9} = req.query;

    // Convert page and limit to numbers, ensuring minimum values
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));

    // Escape special characters for regex search
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let filter = {};

    if (boatPassengers) {
      filter.title = { $regex: escapeRegExp(boatPassengers), $options: "i" };
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

    const user = req.user
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
      bookingsOption,
      boatFuel,
      featureImage,
      gallery,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !description || !address?.country || !address?.city || !boatLength || !boatPassengers || !boatMake || !boatModel || !boatType || !boatCapacity) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate and format booking options
    const formattedBookingOption = Array.isArray(bookingsOption)
      ? bookingsOption
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
      featureImage: featureImage,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
      boatLister: user._id
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

    const updatedBoat = await BoatLister.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )

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
