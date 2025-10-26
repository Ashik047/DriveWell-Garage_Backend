const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE).then(() => {
    console.log("MongoDB connected successfully");
}).catch((err) => {
    console.log(`MongoDB connection failed due to ${err}`);
});