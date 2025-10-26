const express = require("express");
const { addBranchController, getAllBranchesController, editBranchController, deleteBranchController } = require("../controllers/branchController");
const verifyUser = require("../middlewares/verifyUser");
const verifyRole = require("../middlewares/verifyRole");
const { uploadImage } = require("../middlewares/multerMiddleware");
const branchRouter = new express.Router();

branchRouter.route("/")
    .get(getAllBranchesController)
    .post(verifyUser, verifyRole("Manager"), uploadImage.single("image"), addBranchController);

branchRouter.route("/:id")
    .patch(verifyUser, verifyRole("Manager"), uploadImage.single("image"), editBranchController)
    .delete(verifyUser, verifyRole("Manager"), deleteBranchController);


module.exports = branchRouter;