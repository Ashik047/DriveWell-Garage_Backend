require("dotenv").config()

const express = require("express");
const app = express();

const cors = require("cors");
const authRouter = require("./routes/authRoutes");
const path = require('path');
const cookieParser = require("cookie-parser");
require("./databaseConnecton");
const PORT = process.env.PORT || 3000;
const corsConfig = require("./config/corsConfig");
const errorHandler = require("./middlewares/errorHandler");
const branchRouter = require("./routes/branchRoutes");
const userRouter = require("./routes/userRoutes");
const serviceRouter = require("./routes/serviceRoute");
const staffRouter = require("./routes/staffRoute");
const feedbackRouter = require("./routes/feedbackRoute");
const vehicleRouter = require("./routes/vehicleRoute");
const bookingRouter = require("./routes/bookingRoute");
const paymentRouter = require("./routes/paymentRoute");
const dataRouter = require("./routes/dataRoutes");

app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/payment", paymentRouter);

app.use(express.json());

app.use(authRouter);
app.use("/branch", branchRouter);
app.use("/user", userRouter);
app.use("/service", serviceRouter);
app.use("/staff", staffRouter);
app.use("/feedback", feedbackRouter);
app.use("/vehicle", vehicleRouter);
app.use("/booking", bookingRouter);
app.use("/data", dataRouter);

app.all(/(.*)/, (req, res) => {
    return res.status(404).json({ "Message": "Not found." });
})

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});


