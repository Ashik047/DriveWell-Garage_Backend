const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const bookingRouter = new express.Router();
const verifyRole = require("../middlewares/verifyRole");
const { addVehicleController, getMyVehiclesController, editVehicleController, deleteVehicleController } = require("../controllers/vehicleController");
const { addBookingController, getBookingDatesUnavailable, getBookingController, editBookingStatusController, deleteBookingController, addBookingNotesController, deleteBookingNoteController, updateBillPaymentStatusController, payBillController, getInvoiceController } = require("../controllers/bookingController");

bookingRouter.route("/")
    .get(verifyUser, getBookingController)
    .post(verifyUser, verifyRole("Customer"), addBookingController);

bookingRouter.get("/unavailable", verifyUser, verifyRole("Customer"), getBookingDatesUnavailable);

bookingRouter
    .patch("/:id", verifyUser, verifyRole("Manager", "Staff"), editBookingStatusController)
    .delete("/:id", verifyUser, verifyRole("Customer", "Manager"), deleteBookingController);

bookingRouter.patch("/:id/notes", verifyUser, verifyRole("Manager", "Staff"), addBookingNotesController);
bookingRouter.patch("/:id/notes/:noteId", verifyUser, verifyRole("Manager", "Staff"), deleteBookingNoteController);
bookingRouter.patch("/:id/payment", verifyUser, verifyRole("Manager", "Staff"), updateBillPaymentStatusController);
bookingRouter.patch("/:id/pay-bill", verifyUser, verifyRole("Customer"), payBillController);
bookingRouter.get("/:id/invoice", verifyUser, verifyRole("Customer"), getInvoiceController);

module.exports = bookingRouter;