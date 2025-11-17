const Vehicle = require("../models/vehicleModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const Branch = require("../models/branchModel");
const Service = require("../models/serviceModel");


exports.getDataController = async (req, res) => {
    try {
        const noOfVehicles = await Vehicle.countDocuments({});
        const noOfCustomers = await User.countDocuments({ role: "Customer" });
        const noOfStaff = await User.countDocuments({ role: { $in: ["Manager", "Staff"] } });
        const noOfBranches = await Branch.countDocuments({});
        const noOfServices = await Service.countDocuments({});
        const noOfBookings = await Booking.countDocuments({});
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 4);
        startDate.setDate(1);
        const bookings = await Booking.find({
            date: { $gte: startDate }
        });
        return res.status(200).json({ noOfVehicles, noOfStaff, noOfServices, noOfCustomers, noOfBranches, noOfBookings, bookings });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};