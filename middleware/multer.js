const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// export const config = { api: { bodyParser: false } };

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpeg", "png", "jpg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }], 
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});


const uploadSingle = upload.single("image");

const uploadGallery = upload.array("gallery", 10); 

module.exports = {
  uploadSingle,
  uploadGallery,
};
