const Feedback = require("../models/feedbackModel");
const Branch = require("../models/branchModel");
const Service = require("../models/serviceModel");
const Joi = require("joi");
const { format } = require("date-fns");

exports.getFeedbackController = async (req, res) => {
    try {
        if (req.payload?.role === "Customer") {
            const feedbacks = await Feedback.find({ user: req.payload?.userId }).populate("user", "fullName image");
            return res.status(200).json(feedbacks);
        } else if (req.payload?.role === "Manager" || req.payload?.role === "Staff") {
            const feedbacks = await Feedback.find({}).populate("user", "fullName image");
            return res.status(200).json(feedbacks);
        } else {
            const feedbacks = await Feedback.find({ status: true }).populate("user", "fullName image");
            return res.status(200).json(feedbacks);
        }
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong" });
    }
};

exports.addFeedbackController = async (req, res) => {
    const reqBodySchema = Joi.object({
        rating: Joi.number().required(),
        review: Joi.string().required(),
        branch: Joi.string().required(),
        service: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { rating, review, branch, service } = req.body;
    const date = new Date();
    const formattedDate = format(date, 'dd MMM yyyy');
    const { userId } = req.payload;
    try {
        const reviewCount = await Feedback.countDocuments({ user: userId });
        if (reviewCount >= 4) {
            return res.status(409).json({ "Message": "Maximum allowed reviews reached." })
        }
        const foundBranch = await Branch.exists({ branchName: branch });
        if (!foundBranch) {
            return res.status(404).json({ "Message": "Branch not found." });
        }
        const foundService = await Service.exists({ serviceName: service });
        if (!foundService) {
            return res.status(404).json({ "Message": "Service not found." });
        }
        const newReview = new Feedback({ rating, review, branch, service, date: formattedDate, user: userId });
        await newReview.save();
        return res.status(200).json({ "Message": "Feedback Created Successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editFeedbackController = async (req, res) => {

    const { id } = req.params;
    const reqBodySchema = Joi.object({
        rating: Joi.number().required(),
        review: Joi.string().required(),
        branch: Joi.string().required(),
        service: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { rating, review, branch, service } = req.body;
    const date = new Date();
    const formattedDate = format(date, 'dd MMM yyyy');

    try {
        const foundBranch = await Branch.exists({ branchName: branch });
        if (!foundBranch) {
            return res.status(404).json({ "Message": "Branch not found." });
        }
        const foundService = await Service.exists({ serviceName: service });
        if (!foundService) {
            return res.status(404).json({ "Message": "Service not found." });
        }
        await Feedback.findByIdAndUpdate(id, { rating, review, branch, service, date: formattedDate });
        return res.status(200).json({ "Message": "Feedback Updated Successfully." });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editFeedbackStatusController = async (req, res) => {

    const { id } = req.params;
    try {
        await Feedback.findByIdAndUpdate(id, [{ $set: { status: { $not: "$status" } } }]);
        return res.sendStatus(204);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.deleteFeedbackController = async (req, res) => {
    const { id } = req.params;
    try {
        const foundReview = await Feedback.findById(id);
        if (!foundReview) {
            return res.status(404).json({ "Message": "Review not found." });
        }
        const { role, userId } = req.payload;
        if (role === "Manager" || userId === String(foundReview.user)) {
            await foundReview.deleteOne();
            return res.status(200).json({ "Message": 'Review deleted successfully.' });
        } else {
            return res.status(403).json({ "Message": "You do not have permission to delete this review." });
        }
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};