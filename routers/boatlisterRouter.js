const express = require("express");
const boatListerRouter = express.Router();
const { isLoggedIn } = require("../middleware/auth");

const upload = require("../middleware/multer");
const { uploadSingle } = require("../middleware/multer");
const { uploadGallery } = require("../middleware/multer");
const { getAllBoats, createBoat, updateBoat, deleteBoat } = require("../controllers/boatListerController");


boatListerRouter.get("/boatlister", isLoggedIn, getAllBoats);
boatListerRouter.post("/boatlister", isLoggedIn, uploadGallery, createBoat);
boatListerRouter.put("/boatlister/:id",  isLoggedIn, uploadSingle, updateBoat);
boatListerRouter.delete("/boatlister/:id", isLoggedIn, deleteBoat);

module.exports = {  boatListerRouter };
