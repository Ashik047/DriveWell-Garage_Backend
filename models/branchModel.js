const { required } = require("joi");
const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
    branchName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    image: {
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        }
    },
    staffs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;