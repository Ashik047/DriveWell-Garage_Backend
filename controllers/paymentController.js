const Booking = require("../models/bookingModel");
const stripe = require("stripe")(process.env.STRIPEKEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.webhookController = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(500).json({ "Message": "Payment Failed." });
    }

    // Payment success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const metadata = session.metadata;

        try {
            const newBooking = new Booking({
                vehicle: {
                    vehicleId: metadata.vehicleId,
                    vehicleName: metadata.vehicleName,
                },
                customer: metadata.customer,
                service: metadata.service,
                branch: {
                    branchId: metadata.branchId,
                    branchName: metadata.branchName,
                },
                date: metadata.date,
                description: metadata.description
            });
            await newBooking.save();
            return res.sendStatus(204);

        } catch (err) {
            return res.sendStatus(500);
        }
    }
}