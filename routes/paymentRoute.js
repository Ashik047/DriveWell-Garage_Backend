const express = require("express");
const { webhookController } = require("../controllers/paymentController");
const paymentRouter = express.Router();

paymentRouter.post("/webhook", express.raw({ type: 'application/json' }), webhookController);

module.exports = paymentRouter;