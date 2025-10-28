const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    vehicle: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    plate: {
        type: String,
        required: true
    }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;