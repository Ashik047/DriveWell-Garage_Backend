const express = require("express");
const { registerController, loginController, refreshTokenController, userLogoutController, forgotPasswordController } = require("../controllers/userController");
const authRouter = new express.Router();
const verifyUser = require("../middlewares/verifyUser");

/* authentication */

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/logout", verifyUser, userLogoutController);
authRouter.post("/refresh-token", refreshTokenController);
authRouter.post("/forgot-password", forgotPasswordController);

module.exports = authRouter;