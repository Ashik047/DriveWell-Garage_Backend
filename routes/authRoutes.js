const express = require("express");
const { registerController, loginController, refreshTokenController } = require("../controllers/userController");
const authRouter = new express.Router();

/* authentication */

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/refresh-token", refreshTokenController);

module.exports = authRouter;