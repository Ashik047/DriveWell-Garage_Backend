const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    vehicle: {
        _id: false,
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle"
        },
        vehicleName: {
            type: String,
            required: true
        }
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    service: {
        type: String,
        required: true
    },
    branch: {
        _id: false,
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch"
        },
        branchName: {
            type: String,
            required: true
        }
    },
    date: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: "No description"
    },
    status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "In Progress", "Completed"]
    },
    notes: [
        {
            _id: false,
            staffName: {
                type: String,
                required: true
            },
            note: {
                type: String,
                required: true
            },
            date: {
                type: String,
                required: true
            }
        }
    ]
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;