const express = require("express");
const categoryRouter = express.Router();
const { createCategories, getAllCategories, editCategory, deleteCategory } = require("../controllers/categoryController");
const { isLoggedIn } = require("../middleware/auth");


categoryRouter.post("/create-categories", createCategories);
categoryRouter.get("/categories",  getAllCategories);
categoryRouter.put("/update-category/:id", editCategory);
categoryRouter.delete("/delete-category/:id",  deleteCategory);

module.exports = { categoryRouter };
