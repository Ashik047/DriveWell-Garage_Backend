const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const verifyRole = require("../middlewares/verifyRole");
const { addStaffController, getAllStaffsController, editStaffController, deleteStaffController } = require("../controllers/staffController");
const staffRouter = new express.Router();

staffRouter.route("/")
    .get(verifyUser, verifyRole("Manager", "Staff"), getAllStaffsController)
    .post(verifyUser, verifyRole("Manager"), addStaffController);

staffRouter.route("/:id")
    .patch(verifyUser, verifyRole("Manager"), editStaffController)
    .delete(verifyUser, verifyRole("Manager"), deleteStaffController);

module.exports = staffRouter;