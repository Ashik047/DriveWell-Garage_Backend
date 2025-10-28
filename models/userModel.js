const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ["Customer", "Staff", "Manager"]
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    refreshToken: {
        type: String
    },
    image: {
        url: {
            type: String,
            default: "https://res.cloudinary.com/dypovj4go/image/upload/v1761385110/DriveWell%20Garage/cuxfxm9t0xxtklgv82t9.jpg"
        },
        filename: {
            type: String,
            default: "DriveWell Garage/cuxfxm9t0xxtklgv82t9"
        }
    },
    branch: {
        type: String,
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;