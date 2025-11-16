const express = require("express");
const verifyUser = require("../middlewares/verifyUser");
const verifyRole = require("../middlewares/verifyRole");
const { getDataController } = require("../controllers/dataController");
const dataRouter = new express.Router();

dataRouter.get("/", verifyUser, verifyRole("Manager"), getDataController);

module.exports = dataRouter;