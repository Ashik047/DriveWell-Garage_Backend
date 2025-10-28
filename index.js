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

app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use("/branch", branchRouter);
app.use("/user", userRouter);
app.use("/service", serviceRouter);
app.use("/staff", staffRouter);
app.use("/feedback", feedbackRouter);
app.use("/vehicle", vehicleRouter);

app.all(/(.*)/, (req, res) => {
    return res.status(404).json({ "Message": "Page not found." });
})

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});


