const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const bookingRouter = new express.Router();
const verifyRole = require("../middlewares/verifyRole");
const { addVehicleController, getMyVehiclesController, editVehicleController, deleteVehicleController } = require("../controllers/vehicleController");
const { addBookingController, getBookingDatesUnavailable, getBookingController, editBookingStatusController, deleteBookingController } = require("../controllers/bookingController");

bookingRouter.route("/")
    .get(verifyUser, getBookingController)
    .post(verifyUser, verifyRole("Customer"), addBookingController);

bookingRouter.get("/unavailable", verifyUser, verifyRole("Customer"), getBookingDatesUnavailable);

bookingRouter
    .patch("/:id", verifyUser, verifyRole("Manager", "Staff"), editBookingStatusController)
    .delete("/:id", verifyUser, verifyRole("Customer", "Manager"), deleteBookingController);

module.exports = bookingRouter;