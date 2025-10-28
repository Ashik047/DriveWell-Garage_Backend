const express = require("express");
const { getUserDetailsController, editUserDetailsController, editUserPasswordController, getProfilePicController } = require("../controllers/userController");
const verifyUser = require("../middlewares/verifyUser");
const userRouter = new express.Router();
const { uploadImage } = require("../middlewares/multerMiddleware")

userRouter.route("/self")
    .get(verifyUser, getUserDetailsController)
    .patch(verifyUser, uploadImage.single("image"), editUserDetailsController);

userRouter.patch("/self/secret", verifyUser, editUserPasswordController);

userRouter.get("/profile-pic", verifyUser, getProfilePicController);

module.exports = userRouter;