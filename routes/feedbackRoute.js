const express = require("express");
const { addFeedbackController, getFeedbackController, deleteFeedbackController, editFeedbackController, editFeedbackStatusController } = require("../controllers/feedbackController");
const feedbackRouter = new express.Router();
const verifyRole = require("../middlewares/verifyRole");
const verifyUser = require("../middlewares/verifyUser");

feedbackRouter.route("/")
    .get(verifyUser, getFeedbackController)
    .post(verifyUser, verifyRole("Customer"), addFeedbackController);

feedbackRouter.route("/:id")
    .patch(verifyUser, verifyRole("Customer"), editFeedbackController)
    .delete(verifyUser, verifyRole("Manager", "Customer"), deleteFeedbackController);

feedbackRouter.patch("/status/:id", verifyUser, verifyRole("Manager"), editFeedbackStatusController);

feedbackRouter.get("/guest", getFeedbackController);

module.exports = feedbackRouter;