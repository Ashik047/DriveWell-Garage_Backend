const User = require("../models/userModel");
const Branch = require("../models/branchModel");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const transporter = require("../config/nodeMailer");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_KEY);



exports.getAllStaffsController = async (req, res) => {
    try {
        const allStaffs = await User.find({ role: { $in: ["Manager", "Staff"] } }, { _id: 1, fullName: 1, email: 1, phone: 1, role: 1, branch: 1 });
        return res.status(200).json(allStaffs);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
}

exports.addStaffController = async (req, res) => {
    const reqBodySchema = Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        role: Joi.string().required(),
        branch: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { fullName, email, phone, role, branch } = req.body;
    const emailRegex = /^[\w]+@[\w]+\.com+/g;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ "Message": "Invalid Email." });
    }
    try {
        const foundStaff = await User.findOne({ email });
        if (foundStaff) {
            return res.status(409).json({ "Message": "Staff already exist." });
        }
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
        let password = "";
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const newStaff = new User({ fullName, email, phone, role, branch, password: hashedPassword });
            await newStaff.save({ session });
            await Branch.findOneAndUpdate({ branchName: branch }, { $push: { staffs: newStaff._id } }, { session });
            const mailOptions = {
                from: process.env.MAIL_USER,
                to: email,
                subject: "Welcome to DriveWell Garage!",
                html: `
                <h2>Welcome, ${fullName}!</h2>
                <p>Your staff account has been created successfully.</p>
                <p><b>Login Email:</b> ${email}</p>
                <p><b>Temporary Password:</b> ${password}</p>
                <p>Please log in and change your password immediately.</p>
                <br/>
                <p>Regards,<br/>DriveWell Garage Team</p>
            `
            };
            try {
                // await transporter.sendMail(mailOptions);
                await resend.emails.send(mailOptions);
            } catch (err) {
                return res.status(500).json({ "Message": "Failed to sent mail to the staff. New staff creating failed." })
            }
        });
        return res.status(200).json({ "Message": `New Staff added successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

module.exports.editStaffController = async (req, res) => {
    const { id } = req.params;
    const reqBodySchema = Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        role: Joi.string().required(),
        branch: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { fullName, email, phone, role, branch } = req.body;
    const emailRegex = /^[\w]+@[\w]+\.com+/g;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ "Message": "Invalid Email." });
    }
    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const foundStaff = await User.findByIdAndUpdate(id, { fullName, email, phone, role, branch }, { session });
            if (foundStaff?.branch && foundStaff.branch !== branch) {
                await Promise.all([
                    Branch.findOneAndUpdate(
                        { branchName: branch },
                        { $push: { staffs: foundStaff._id } },
                        { session }
                    ),
                    Branch.findOneAndUpdate(
                        { branchName: foundStaff.branch },
                        { $pull: { staffs: foundStaff._id } },
                        { session }
                    )
                ]);
            }
        });
        return res.status(200).json({ "Message": `Staff details updated successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong.", err });
    }

};

exports.deleteStaffController = async (req, res) => {
    const { id } = req.params;
    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const result = await User.findByIdAndDelete(id, { session });
            if (!result) {
                return res.status(400).json({ "Message": "Staff not found." });
            }
            if (result.branch) {
                await Branch.findOneAndUpdate(
                    { branchName: result.branch },
                    { $pull: { staffs: result._id } },
                    { session });
            }
        });
        return res.status(200).json({ "Message": `Staff removed successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};