const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;