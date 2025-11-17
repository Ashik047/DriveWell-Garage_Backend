const Booking = require("../models/bookingModel");
const Branch = require("../models/branchModel");
const Service = require("../models/serviceModel");
const Vehicle = require("../models/vehicleModel");
const Joi = require("joi");
const { format } = require("date-fns");
const transporter = require("../config/nodeMailer");


exports.getBookingController = async (req, res) => {
    const { role, userId, branch } = req.payload;
    try {
        let result;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        if (role === "Customer") {
            result = await Booking.find({ customer: userId, date: { $lte: startDate } }).exec();
        } else if (role === "Staff" || role === "Manager") {
            result = await Booking.find({ "branch.branchName": branch, date: { $lte: startDate } }).exec();
        }
        res.status(200).json(result);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.getInvoiceController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Booking.findById(id).populate("customer", "fullName email phone").populate("branch.branchId", "location phone").populate("vehicle.vehicleId");
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
    const { userName, email } = req.payload;
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
                type: "advance",
                vehicleId: vehicle._id.toString(),
                vehicleName: vehicle.vehicle,
                branchId: branch._id.toString(),
                branchName: branch.branchName,
                service,
                date,
                customer: userId.toString(),
                customerName: userName,
                customerEmail: email,
                description
            },
            success_url: "https://drive-well-garage-frontend.vercel.app/payment-success",
            cancel_url: "https://drive-well-garage-frontend.vercel.app/payment-error"       // on payment failure
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
        status: Joi.string().required(),
        billDetails: Joi.array().required()
    }).required();

    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { status, billDetails } = req.body;
    const { userName, email } = req.payload;

    if (status === "Completed" && billDetails?.length <= 0) {
        return res.status(400).json({ "Message": "Billing details are missing." });
    }

    try {
        const result = await Booking.findByIdAndUpdate(id, { status, bill: billDetails }, { new: true }).populate("customer");
        if (status === "Completed") {
            const totalBill = result.bill?.map(item => item.repairCost)?.reduce((sum, cost) => sum + cost, 0);
            const mailOptions = {
                from: process.env.MAIL_USER,
                to: result.customer.email,
                subject: "Service Completed",
                html: `
                        <h2>Your Service Is Completed, ${result.customer.fullName}!</h2>

                        <p>Thank you for choosing <b>DriveWell Garage</b>. Your vehicle service has been successfully completed.</p>

                        <h3>📌 Service Summary</h3>
                        <p><b>Service:</b> ${result.service}</p>
                        <p><b>Vehicle:</b> ${result.vehicle.vehicleName}</p>
                        <p><b>Service Date:</b> ${format(result.date, 'dd MMM yyyy')}</p>
                        <p><b>Branch:</b> ${result.branch.branchName}</p>

                        <br/>

                        <p><b>Payment:</b> Your final bill amount is <b>$${totalBill - 5}</b>.  
                        Please complete the payment to receive your service invoice.</p>

                        <br/>

                        <p>Once the payment is made, your invoice will be generated and available for download.</p>

                        <br/>

                        <p>Thank you for trusting us with your vehicle. We hope you had a smooth service experience.</p>

                        <br/>

                        <p>If you have any questions or need assistance, feel free to reach out.<br/>
                        <b>DriveWell Garage Team</b></p>

                    `
            };
            await transporter.sendMail(mailOptions);
        }
        return res.status(200).json({ "Message": "Booking status updated successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.addBookingNotesController = async (req, res) => {
    const { id } = req.params;
    const reqBodySchema = Joi.object({
        note: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { note } = req.body;
    const { userName } = req.payload;
    const date = new Date();
    const formattedDate = format(date, 'dd MMM yyyy');
    try {
        await Booking.findByIdAndUpdate(id, {
            $push: {
                notes: {
                    staffName: userName,
                    note,
                    date: formattedDate
                }
            }
        });
        return res.status(200).json({ "Message": "Note added successfully." });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.deleteBookingNoteController = async (req, res) => {
    const { id, noteId } = req.params;
    try {
        await Booking.findByIdAndUpdate(id, { $pull: { notes: { _id: noteId } } });
        return res.status(200).json({ "Message": "Note deleted successfully." });

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

exports.updateBillPaymentStatusController = async (req, res) => {
    const { id } = req.params;
    const currentDate = new Date();
    try {
        const result = await Booking.findByIdAndUpdate(id, { billPayment: true, paymentDate: currentDate, paymentMethod: "Cash" }, { new: true }).populate("customer");
        const totalBill = result.bill?.map(item => item.repairCost)?.reduce((sum, cost) => sum + cost, 0);
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: result.customer.email,
            subject: "Final Payment Successfully",
            html: `
                            <h2>Your Final Payment Is Successfully Completed, ${result.customer.fullName}!</h2>

                            <p>Thank you for choosing <b>DriveWell Garage</b>. Your service payment has been successfully processed.</p>

                            <h3>📌 Service Summary</h3>
                            <p><b>Service:</b> ${result.service}</p>
                            <p><b>Vehicle:</b> ${result.vehicle.vehicleName}</p>
                            <p><b>Service Date:</b> ${format(result.date, 'dd MMM yyyy')}</p>
                            <p><b>Branch:</b> ${result.branch.branchName}</p>

                            <br/>

                            <p><b>Payment:</b> We have received your final payment of <b>$${totalBill - 5}</b>.</p>
                            <p>Your previous advance payment of <b>$5</b> has been adjusted in the final bill.</p>

                            <br/>
                            <p>Your invoice has been generated and is now available for download.</p>
                            <br/>

                            <p>Thank you for trusting us with your vehicle. We hope you had a smooth service experience.</p>

                            <br/>

                            <p>If you have any questions or feedback, feel free to reach out.<br/>
                            <b>DriveWell Garage Team</b></p>
                    `
        };
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ "Message": "Billing status updated successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.payBillController = async (req, res) => {
    const reqBodySchema = Joi.object({
        bookingDetails: Joi.object().required()
    }).required();

    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { id } = req.params;
    const { userId, userName, email } = req.payload;
    const { vehicle, service, branch, date, description, bill } = req.body.bookingDetails;
    // console.log(req.body.bookingDetails);

    const totalBill = bill?.map(item => item.repairCost)?.reduce((sum, cost) => sum + cost, 0);

    try {
        const foundBooking = await Booking.findById(id);
        if (!foundBooking) {
            return res.status(404).json({ "Message": "Booking not found." });
        }
        const line_item = [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: vehicle.vehicleName,
                    description: `${service}  ${branch.branchName}`
                },
                unit_amount: Math.round((totalBill - 5) * 100)
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
                type: "final",
                bookingId: id,
                finalBill: totalBill - 5,
                vehicleId: vehicle.vehicleId.toString(),
                vehicleName: vehicle.vehicleName,
                branchId: branch.branchId.toString(),
                branchName: branch.branchName,
                service,
                date,
                customer: userId.toString(),
                customerName: userName,
                customerEmail: email,
                description
            },
            success_url: "https://drive-well-garage-frontend.vercel.app/payment-success",
            cancel_url: "https://drive-well-garage-frontend.vercel.app/payment-error"       // on payment failure
        });
        // await newBooking.save();
        res.status(200).json({ url: session.url });

    } catch (err) {
        // console.log(err);

        return res.status(500).json({ "Message": "Something went wrong." });
    }

};