const User = require("../models/userModel");
const passport = require("passport");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../middlewares/multerMiddleware");

/* auth controllers */

module.exports.registerController = async (req, res) => {
    const reqBodySchema = Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { fullName, email, phone, password, confirmPassword } = req.body;
    const emailRegex = /^[\w]+@[\w]+\.com/g;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ "Message": "Invalid Email." });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ "Message": "Passwords do not match." });
    }
    try {
        const properEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: properEmail }).exec();
        if (existingUser) {
            return res.status(409).json({ "Message": "User already exists. Please login instead." });
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            fullName, email: properEmail, phone, password: hashPassword, role: "Customer"
        });
        await newUser.save();
        return res.status(200).json({ "Message": "Account created successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }

};

module.exports.loginController = async (req, res) => {

    const reqBodySchema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { email, password } = req.body;
    try {

        const properEmail = email.toLowerCase();
        const foundUser = await User.findOne({ email: properEmail }).exec();
        if (!foundUser) {
            return res.status(401).json({ "Message": "Invalid email or password." });
        }
        const passwordMatch = await bcrypt.compare(password, foundUser.password);
        if (passwordMatch) {
            /* const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "_id": foundUser._id,
                        "email": foundUser.email,
                        "role": foundUser.role
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            ); */
            const refreshToken = jwt.sign(
                { "email": foundUser.email },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
            foundUser.refreshToken = hashedToken;
            await foundUser.save();
            res.cookie('wisp', refreshToken, { httpOnly: true, /* secure: true, sameSite: 'None', */ maxAge: 24 * 60 * 60 * 1000 });
            return res.status(200).json({ "Message": "Login Successful"/* , "role": foundUser.role, accessToken  */ });

        } else {
            return res.status(401).json({ "Message": "Invalid email or password." });
        }
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong" });
    }

};

module.exports.userLogoutController = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.wisp) return res.status(200).json({ "Message": "You have successfully logged out." });
    const refreshToken = cookies.wisp;
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    try {
        const foundUser = await User.findOne({ refreshToken: hashedToken }).exec();
        if (!foundUser) {
            res.clearCookie('wisp', { httpOnly: true, /* secure: true, sameSite: 'None', */ maxAge: 24 * 60 * 60 * 1000 });
            return res.status(200).json({ "Message": "You have successfully logged out." });
        }
        foundUser.refreshToken = '';
        await foundUser.save();
        res.clearCookie('wisp', { httpOnly: true, /* secure: true, sameSite: 'None', */ maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({ "Message": "You have successfully logged out." });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong. You were not logged out." });
    }
};

module.exports.refreshTokenController = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies.wisp) {
        return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
    }
    const refreshToken = cookies.wisp;
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    try {
        const foundUser = await User.findOne({ refreshToken: hashedToken }).exec();
        if (!foundUser) {
            return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.email !== decoded.email) {
                    return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
                }
                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            "userId": foundUser._id,
                            "userName": foundUser.fullName,
                            "email": foundUser.email,
                            "role": foundUser.role
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '15m' }
                );
                // console.log(accessToken);

                return res.status(200).json({ "Message": "New Access Token Created", "role": foundUser.role, accessToken });
            }
        );

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong" });
    }

};


/* user controllers */

module.exports.getUserDetailsController = async (req, res) => {
    const { userId } = req.payload;
    try {
        const result = await User.findById(userId, { password: 0, __v: 0, refreshToken: 0, branch: 0, status: 0 }).exec();
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

module.exports.getProfilePicController = async (req, res) => {
    const { userId } = req.payload;
    try {
        const result = await User.findById(userId, { image: 1 }).exec();
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

module.exports.editUserDetailsController = async (req, res) => {
    const { userId } = req.payload;
    const reqBodySchema = Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
    }).required().unknown(true);
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { fullName, email, phone, address = "", image, prevImage } = req.body;
    const emailRegex = /^[\w]+@[\w]+\.com+/g;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ "Message": "Invalid Email." });
    }

    const path = req.file ? req.file.path : image.url;
    const { filename } = req.file ? req.file : image;
    try {
        if (prevImage && prevImage !== "DriveWell Garage/cuxfxm9t0xxtklgv82t9") {
            await cloudinary.uploader.destroy(prevImage);
        }
        await User.findByIdAndUpdate(userId, { fullName, email, phone, address, image: { url: path, filename } }, { new: true });
        return res.status(200).json({ "Message": `Profile Details updated successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }

};

module.exports.editUserPasswordController = async (req, res) => {
    const { userId } = req.payload;
    const reqBodySchema = Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ "Message": "Passwords do not match." });
    }
    try {
        const foundUser = await User.findById(userId, "password").exec();
        if (!foundUser) {
            return res.status(404).json({ "Message": "User not found." });
        }
        const passwordMatch = await bcrypt.compare(currentPassword, foundUser.password);
        if (!passwordMatch) {
            return res.status(400).json({ "Message": "Incorrect Password." });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        foundUser.password = hashedPassword;
        await foundUser.save();
        return res.status(200).json({ "Message": "Password updated successfully." });

    } catch (err) {
        return res.status(500).json("Something went wrong.");
    }
}