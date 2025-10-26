const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const verifyRole = require("../middlewares/verifyRole");
const { addStaffController } = require("../controllers/staffController");
const staffRouter = new express.Router();

staffRouter.route("/")
    .post(verifyUser, verifyRole("Manager"), addStaffController);

module.exports = staffRouter;