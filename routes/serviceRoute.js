const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const { uploadImage } = require("../middlewares/multerMiddleware");
const { addServiceController, getAllServicesController, editServiceController, deleteServiceController } = require("../controllers/serviceController");
const verifyRole = require("../middlewares/verifyRole");
const serviceRouter = new express.Router();

serviceRouter.route("/")
    .get(getAllServicesController)
    .post(verifyUser, verifyRole("Manager"), uploadImage.single("image"), addServiceController);

serviceRouter.route("/:id")
    .patch(verifyUser, verifyRole("Manager"), uploadImage.single("image"), editServiceController)
    .delete(verifyUser, verifyRole("Manager"), deleteServiceController);

module.exports = serviceRouter;