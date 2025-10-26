const { cloudinary } = require("../middlewares/multerMiddleware");
const Branch = require("../models/branchModel");
const Joi = require("joi");

exports.getAllBranchesController = async (req, res) => {
    const { fields } = req.query;
    const filter = {};
    if (fields) {
        const fieldList = fields.split(",");
        fieldList.forEach(field => filter[field] = 1);
    }
    try {
        const allBranches = await Branch.find({}, filter);
        return res.status(200).json(allBranches);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
}

exports.addBranchController = async (req, res) => {

    const reqBodySchema = Joi.object({
        branchName: Joi.string().required(),
        location: Joi.string().required(),
        phone: Joi.string().required(),
        longitude: Joi.number().required(),
        latitude: Joi.number().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    if (!req.file) {
        return res.status(400).json({ "Message": "Branch Photo is required." });
    }
    const { branchName, location, phone, longitude, latitude } = req.body;
    const { path, filename } = req.file;
    try {
        const foundBranch = await Branch.findOne({
            branchName: {
                $regex: `^${branchName}$`,
                $options: "i"
            }
        });
        if (foundBranch) {
            return res.status(409).json({ "Message": "Branch already exists." });
        }
        const newBranch = new Branch({ branchName, location, phone, longitude, latitude, image: { url: path, filename } });
        await newBranch.save();
        return res.status(200).json({ "Message": `Successfully created new branch ${branchName}.` });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editBranchController = async (req, res) => {

    const { id } = req.params;
    const reqBodySchema = Joi.object({
        branchName: Joi.string().required(),
        location: Joi.string().required(),
        phone: Joi.string().required(),
        longitude: Joi.number().required(),
        latitude: Joi.number().required()
    }).required().unknown(true);
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { branchName, location, phone, longitude, latitude, image, prevImage } = req.body;

    const path = req.file ? req.file.path : image.url;
    const { filename } = req.file ? req.file : image;

    try {
        if (prevImage) {
            await cloudinary.uploader.destroy(prevImage);
        }
        const result = await Branch.findByIdAndUpdate(id, { branchName, location, phone, longitude, latitude, image: { url: path, filename } }, { new: true });
        return res.status(200).json({ "Message": `Branch details of ${result.branchName} updated successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};


exports.deleteBranchController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Branch.findByIdAndDelete(id);
        await cloudinary.uploader.destroy(result.image.filename);
        return res.status(200).json({ "Message": `Branch ${result.branchName} deleted successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

