const Booking = require("../models/bookingModel");
const Branch = require("../models/branchModel");
const Service = require("../models/serviceModel");
const Vehicle = require("../models/vehicleModel");
const Joi = require("joi");


exports.getBookingController = async (req, res) => {
    const { role, userId, branch } = req.payload;
    try {
        let result;
        if (role === "Customer") {
            result = await Booking.find({ customer: userId }).exec();
        } else if (role === "Staff" || role === "Manager") {
            result = await Booking.find({ "branch.branchName": branch }).exec();
        }
        res.status(200).json(result);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.addBookingController = async (req, res) => {
    const reqBodySchema = Joi.object({
        vehicle: Joi.object({
            _id: Joi.string().required(),
            vehicle: Joi.string().required()
        }).required(),
        service: Joi.string().required(),
        branch: Joi.object({
            _id: Joi.string().required(),
            branchName: Joi.string().required()
        }).required(),
        date: Joi.string().required()
    }).required().unknown(true);

    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { vehicle, service, branch, date, description } = req.body;
    if (new Date(date) < new Date()) {
        return res.status(400).json({ message: "Cannot book for a past date." });
    }

    try {
        const { userId, userName } = req.payload;
        const [foundBranch, foundService, foundVehicle] = await Promise.all([
            Branch.exists({ branchName: branch.branchName }),
            Service.exists({ serviceName: service }),
            Vehicle.exists({ _id: vehicle._id, owner: userName })
        ]);
        if (!foundBranch) {
            return res.status(404).json({ "Message": "Branch not found." });
        }
        if (!foundService) {
            return res.status(404).json({ "Message": "Service not found." });
        }
        if (!foundVehicle) {
            return res.status(404).json({ "Message": "Vehicle not found." });
        }
        const countBooking = await Booking.countDocuments({ date, branch, service });
        if (countBooking >= 4) {
            return res.status(409).json({ "Message": "Fully booked for this date!" });
        }
        const foundBooking = await Booking.findOne({ date, "vehicle.vehicleId": vehicle._id });
        if (foundBooking) {
            return res.status(409).json({ "Message": "Vehicle is already booked for a service on the selected date." });
        }

        const line_item = [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: vehicle.vehicle,
                    description: `${service}  ${branch.branchName}`
                },
                unit_amount: Math.round(5 * 100)
            },
            quantity: 1
        }];

        /* create a stripe checkout */
        const stripe = require('stripe')(process.env.STRIPEKEY);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_item,          // details of product that is purchased
            mode: "payment",
            metadata: {
                vehicleId: vehicle._id.toString(),
                vehicleName: vehicle.vehicle,
                branchId: branch._id.toString(),
                branchName: branch.branchName,
                service,
                date,
                customer: userId.toString(),
                description
            },
            success_url: "http://localhost:5173/payment-success",
            cancel_url: "http://localhost:5173/payment-error"       // on payment failure
        });
        // await newBooking.save();
        res.status(200).json({ url: session.url });

    } catch (err) {
        console.log(err);

        return res.status(500).json({ "Message": "Something went wrong." });
    }

};

exports.getBookingDatesUnavailable = async (req, res) => {
    const { branch, service } = req.query;
    try {
        const result = await Booking.aggregate([
            {
                $match: {
                    service,                // string match 
                    "branch.branchName": branch,
                },
            },
            {
                $group: {
                    _id: "$date",           // group all bookings by date
                    count: { $sum: 1 },
                },
            },
            {
                $match: {
                    count: { $gte: 3 },     // filter out days with <3 bookings
                },
            },
            {
                $project: {
                    _id: 1,                    // keep only the date
                },
            },
        ]);

        // Extract just the date strings
        const unavailableDates = result.map((date) => date._id);
        res.status(200).json(unavailableDates);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editBookingStatusController = async (req, res) => {
    const { id } = req.params;
    const reqBodySchema = Joi.object({
        status: Joi.string().required()
    }).required();

    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { status } = req.body;
    try {
        await Booking.findByIdAndUpdate(id, { status });
        return res.status(200).json({ "Message": "Booking status updated successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.deleteBookingController = async (req, res) => {
    const { id } = req.params;

    try {
        await Booking.findByIdAndDelete(id);
        return res.status(200).json({ "Message": "Booking deleted successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};