const User = require("../models/userModel");
const Branch = require("../models/branchModel");
const Joi = require("joi");
const bcrypt = require("bcrypt");

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
        const password = "password";
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = new User({ fullName, email, phone, role, branch, password: hashedPassword });
        await newStaff.save();
        await Branch.findOneAndUpdate({ branchName: branch }, { $push: { staffs: newStaff._id } });
        return res.status(200).json({ "Message": `New staff ${newStaff.fullName} added successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong.", err });
    }
};