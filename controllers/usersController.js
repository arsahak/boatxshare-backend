const createError = require("http-errors");
const data = require("../data");
const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { findWithId } = require("../services/findWithId");
const createJsonWebToken = require("../helper/jsonWebToken");
const { jwtSecretKey, clientUrl } = require("../secret");
const sendEmailWithNodeMailer = require("../helper/email");
const jwt = require("jsonwebtoken");
const runValidation = require("../validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const puppeteer = require("puppeteer");

const getAllUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 5);

    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegExp(search);

    const searchRegExp = new RegExp(`.*${safeSearch}.*`, "i");

    const filter = {
      isAdmin: { $ne: true },
      $or: [
        { name: searchRegExp },
        { email: searchRegExp },
        { phone: searchRegExp },
      ],
    };

    const options = { password: 0 };

    const users = await User.find(filter, options)
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.find(filter).countDocuments();

    if (!users) throw createError(404, "no users found ");

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      statusCode: 201,
      message: "Users successfully returned",
      payload: {
        users,
        pagination: {
          totalPages,
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get User by Id

const getUserById = async (req, res, next) => {
  try {
    
    const id = req.user._id;
    
    const options = { password: 0 };

    const user = await findWithId(User, id, options);

    return successResponse(res, {
      statusCode: 201,
      message: "User successfully returned",
      payload: { user },
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};



// Delete User for Admin

const deleteUserById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const user = await User.findByIdAndDelete({ _id: id, isAdmin: false });

    if (!user) {
      throw createError(404, "User dose not exist with this id");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "User successfully deleted",
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};

// Process Register

const processRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.exists({ email: email });

    if (userExists) {
      throw createError(
        409,
        "User with this email already exists, Please signin"
      );
    }

    const jwtToken = await createJsonWebToken(
      { name, email, password, phone, address },
      jwtSecretKey,
      { expiresIn: "10m" }
    );

    const emailData = {
      email,
      subject: "Activate Your Account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color:rgb(212, 212, 212); 
                margin: 0;
                padding: 0;
                color: #333;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: #1ABFEA;
                color: #ffffff;
                padding: 20px;
                text-align: center;
              }
              .content {
                padding: 20px;
                text-align: center; /* Center-align text and elements */
              }
              .cta-button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #1ABFEA;
                color:rgb(255, 255, 255);
                text-decoration: none;
                border-radius: 4px;
                font-size: 16px;
                text-align: center;
              }
              .cta-button:hover {
                background: #00AEE5;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #666;
                padding: 10px;
                border-top: 1px solid #eaeaea;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome, ${name}!</h1>
              </div>
              <div class="content">
                <p>Thank you for signing up with us. Please activate your account by clicking the button below:</p>
                <a href="${clientUrl}/user/activate/${jwtToken}" class="cta-button" target="_blank">Activate Your Account</a>
                <p>If you did not sign up for this account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
              </div>
            </div>
          </body>
        </html>
      `,
    };
    
    

    try {
      await sendEmailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    return successResponse(res, {
      statusCode: 200,
      message: `Please go to your ${email} for completing your registration process`,
      payload: { token: jwtToken },
    });
  } catch (error) {
    next(error);
  }
};

// Active user

const activateUserAccount = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw createError(404, "Token not found");
    }

    try {
      const decoded = jwt.verify(token, jwtSecretKey);

      if (!decoded) {
        throw createError(401, "User could not be verified");
      }

      const userExists = await User.exists({ email: decoded.email });

      if (userExists) {
        throw createError(
          409,
          "User with this email already exists, Please signin"
        );
      }

      await User.create(decoded);

      return successResponse(res, {
        statusCode: 201,
        message: "User was registered successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw createError(401, "Token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw createError(401, "Invalid token");
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

// Update user by id

const updateUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const updateOptions = { new: true, runValidators: true, context: "query" };

    await findWithId(User, userId, updateOptions);

    let updates = {};

    for (let key in req.body) {
      if (["name", "phone", "password", "address"].includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      updates,
      updateOptions
    );

    if (!updateUser) {
      throw createError(404, "User with is id does not exist");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "User was update successfully",
      payload: updateUser,
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};


// Update user by id

const updateUserPassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;


    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }


    const comparePassword = await bcrypt.compare(oldPassword, user.password);
    if (!comparePassword) {
      throw createError(400, "Invalid old password");
    }


    if (newPassword !== confirmPassword) {
      throw createError(400, "New Password and Confirm Password do not match");
    }



    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw createError(400, "Failed to update password");
    }


    return successResponse(res, {
      statusCode: 200,
      message: "User password updated successfully",
      payload: { user: updatedUser },
    });
  } catch (error) {

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }

    next(error);
  }
};


// Forget password

const forgetPassword= async (req, res, next) => {
  try {
    const { email } = req.body;
   
    const user = await User.findOne({email: email});
    if (!user) {
      throw createError(404, "User not found");
    }

    const jwtToken = await createJsonWebToken(
      { email },
      jwtSecretKey,
      { expiresIn: "10m" }
    );

    const emailData = {
      email,
      subject: "Account Activation Email",
      html: `<h1>Hello ${user.name}!</h1> <p>Please click here to <a href = "${clientUrl}/api/user/reset-password/${jwtToken}" target = "_black">Reset Password</a></p>`,
    };

    try {
      await sendEmailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    return successResponse(res, {
      statusCode: 200,
      message: `Please go to your ${email} for resting your password`,
      payload: { token: jwtToken },
    });
  } catch (error) {

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }

    next(error);
  }
};

// reset password

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, jwtSecretKey);
    if (!decoded || !decoded.email) {
      throw createError(401, "Invalid or expired token");
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email }, 
      { password: newPassword },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw createError(400, "Failed to reset password");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Password was reset successfully",
      payload: { user: updatedUser },
    });
  } catch (error) {

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(createError(401, "Invalid or expired token"));
    }

    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid user ID"));
    }


    next(error);
  }
};


// Boat listing request create

const isBoatListingRequestCreate = async (req, res, next) => {
  try {
    const userId = req.user; 
    const { isBoatListerDetails } = req.body;


    if (!isBoatListerDetails || typeof isBoatListerDetails !== "object") {
      throw createError(400, "Valid Listing Request Info must be provided.");
    }


    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found.");
    }


    user.isBoatListerDetails = {
      ...user.isBoatListerDetails, 
      ...isBoatListerDetails,     
    };

    const updatedUser = await user.save();


    return successResponse(res, {
      statusCode: 200,
      message: "Listing Request Info was updated successfully.",
      payload: updatedUser,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return next(createError(400, "Invalid User ID"));
    }
    next(error); 
  }
};


const isBoatListingRequestUpdate = async (req, res, next) => {
  try {
    const userId = req.user;
    const { isBoatLister, isBoatListerDetails } = req.body;

    

    // Validate that isBoatListerDetails is provided and is an object
    if (!isBoatListerDetails || typeof isBoatListerDetails !== "object") {
      return res.status(400).json({
        status: "error",
        message: "Valid Listing Request Info must be provided."
      });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found."
      });
    }

    // Update isBoatLister and merge isBoatListerDetails
    user.isBoatLister = isBoatLister !== undefined ? isBoatLister : user.isBoatLister;
    user.isBoatListerDetails = {
      ...user.isBoatListerDetails,
      ...isBoatListerDetails,
    };

    // Save the updated user object to the database
    const updatedUser = await user.save();

    // Respond with a success message and updated user data
    return res.status(200).json({
      status: "success",
      message: "Listing Request Info was updated successfully.",
      payload: updatedUser,
    });
  } catch (error) {
    // Handle specific database errors
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        status: "error",
        message: "Invalid User ID."
      });
    }

    // Pass other errors to the error-handling middleware
    next(error);
  }
};



const testUserImageUpload = async (req, res, next) => {
  try {

    const featureImage = req.file?.path; 

    if (!featureImage) {
      throw createError(400, "Feature image is required and should be under 10MB");
    }

    console.log("check image url", featureImage);
    

  return successResponse(res, {
      statusCode: 200,
      message: "User successfully deleted",
      payload: { imgUrl:  featureImage },
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};


const testUserImageUploadMultiple = async (req, res, next) => {
  try {

  

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
  
    const fileUrls = req.files.map((file) => file.path); 
    console.log("check url", fileUrls);

    

  return successResponse(res, {
      statusCode: 200,
      message: "User successfully deleted",
      payload: { imgUrl:  featureImage },
    });
  } catch (error) {
    if(error instanceof mongoose.Error.CastError){
      throw createError(400, "Invalid Id")
    }
    next(error);
  }
};

const fileUrl = async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("URL is required.");
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    const htmlContent = await page.content(); // Fetch the full HTML content

    await browser.close();

    // Set headers for file download
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="page.html"`);
    res.send(htmlContent);
  } catch (error) {
    console.error("Error fetching HTML:", error);
    res.status(500).send("Error fetching HTML content");
  }
};



module.exports = {
  getAllUsers,
  getUserById,
  deleteUserById,
  processRegister,
  activateUserAccount,
  updateUserById,
  updateUserPassword,
  forgetPassword,
  resetPassword,
  testUserImageUpload,
  testUserImageUploadMultiple ,
  isBoatListingRequestUpdate,
  fileUrl,
  isBoatListingRequestCreate
};
