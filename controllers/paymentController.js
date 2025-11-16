const transporter = require("../config/nodeMailer");
const Booking = require("../models/bookingModel");
const stripe = require("stripe")(process.env.STRIPEKEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const { format } = require("date-fns");

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

        const newDate = new Date(metadata.date);

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
                date: newDate,
                description: metadata.description
            });
            await newBooking.save();
            const mailOptions = {
                from: process.env.MAIL_USER,
                to: metadata.customerEmail,
                subject: "Service Booking is Confirmed",
                html: `
                        <h2>Your Service Booking is Confirmed, ${metadata.customerName}!</h2>

                        <p>Thank you for choosing <b>DriveWell Garage</b>. Your service request has been successfully booked.</p>

                        <h3>📌 Booking Details</h3>
                        <p><b>Service:</b> ${metadata.service}</p>
                        <p><b>Vehicle:</b> ${metadata.vehicleName}</p>
                        <p><b>Booking Date:</b> ${format(newDate, 'dd MMM yyyy')}</p>
                        <p><b>Branch:</b> ${metadata.branchName}</p>

                        <br/>

                        <p><b>Payment:</b> We have received your advance payment of <b>$5</b> to secure your booking. This amount will be adjusted in your final service bill at the workshop.</p>

                        <br/>

                        <p>Our team will be ready for your arrival. If you need to modify or cancel your booking, please contact us in advance.</p>

                        <br/>

                        <p>Looking forward to serving you!<br/>
                        <b>DriveWell Garage Team</b></p>
                    `
            };
            await transporter.sendMail(mailOptions);
            return res.sendStatus(204);

        } catch (err) {
            return res.sendStatus(500);
        }
    }
}