const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
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
    }
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;