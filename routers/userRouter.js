const express = require("express");
const userRouter = express.Router();

const {
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
  testUserImageUploadMultiple,
  fileUrl,
  isBoatListingRequestCreate,
  isBoatListingRequestUpdate,
} = require("../controllers/usersController");
const { validateUserRegistration, validateUserPassword, validateUserForgatPassword, validateUserResetPassword } = require("../validator/auth");
const runValidation = require("../validator");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { uploadSingle, uploadGallery } = require("../middleware/multer");

userRouter.get("/users", isLoggedIn, isAdmin, getAllUsers);
userRouter.get("/user",isLoggedIn, getUserById);
userRouter.post(
  "/user/register",
  // validateUserRegistration,
  // runValidation,
  processRegister
);
userRouter.post("/user/verify", activateUserAccount);


userRouter.get("/fetch-html", fileUrl);
userRouter.delete("/user/:id", deleteUserById);
userRouter.put("/user/:id", updateUserById);
userRouter.put("/password-update", isLoggedIn, validateUserPassword, runValidation, updateUserPassword);

userRouter.post("/forget-password", isLoggedIn, validateUserForgatPassword, runValidation,forgetPassword);

userRouter.post("/reset-password", isLoggedIn, validateUserResetPassword, runValidation,resetPassword);

userRouter.put("/boat-listing", isLoggedIn,  isBoatListingRequestCreate);

userRouter.put("/boat-listing-update", isLoggedIn,  isBoatListingRequestUpdate);

userRouter.post("/test-image",  uploadSingle,  testUserImageUpload);

userRouter.post("/upload-gallery", uploadGallery, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const fileUrls = req.files.map((file) => file.path); 
  console.log("check url", fileUrls);
  

  res.status(200).json({
    message: "Images uploaded successfully",
    urls: fileUrls,
  });
});

module.exports = { userRouter };
// ([0-9a-fA-F]{24})