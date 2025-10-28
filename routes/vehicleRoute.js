const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const vehicleRouter = new express.Router();
const verifyRole = require("../middlewares/verifyRole");
const { addVehicleController, getMyVehiclesController, editVehicleController, deleteVehicleController } = require("../controllers/vehicleController");

vehicleRouter.route("/")
    .get(verifyUser, verifyRole("Customer"), getMyVehiclesController)
    .post(verifyUser, verifyRole("Customer"), addVehicleController);

vehicleRouter.route("/:id")
    .patch(verifyUser, verifyRole("Customer"), editVehicleController)
    .delete(verifyUser, verifyRole("Customer"), deleteVehicleController);

module.exports = vehicleRouter;