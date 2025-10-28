const Service = require("../models/serviceModel");
const Joi = require("joi");
const { cloudinary } = require("../middlewares/multerMiddleware");

exports.getAllServicesController = async (req, res) => {
    const { type } = req.query;
    const filter = {};
    if (type) {
        filter[type] = 1;
    }
    try {
        const allServices = await Service.find({}, filter);
        return res.status(200).json(allServices);
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.addServiceController = async (req, res) => {
    const reqBodySchema = Joi.object({
        serviceName: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
    }).required().unknown(true);
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    if (!req.file) {
        return res.status(400).json({ "Message": "Service Photo is required." });
    }
    const { serviceName, description, price } = req.body;
    const { path, filename } = req.file;
    try {
        const foundService = await Service.findOne({
            serviceName: {
                $regex: `^${serviceName}$`,
                $options: "i"
            }
        });
        if (foundService) {
            return res.status(409).json({ "Message": "Service already exists." });
        }
        const newService = new Service({ serviceName, description, price, image: { url: path, filename } });
        await newService.save();
        return res.status(200).json({ "Message": `Successfully created new service ${serviceName}.` });

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editServiceController = async (req, res) => {

    const { id } = req.params;
    const reqBodySchema = Joi.object({
        serviceName: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
    }).required().unknown(true);
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(err => err.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }

    const { serviceName, description, price, image, prevImage } = req.body;

    const path = req.file ? req.file.path : image.url;
    const { filename } = req.file ? req.file : image;

    try {
        if (prevImage) {
            await cloudinary.uploader.destroy(prevImage);
        }
        const result = await Service.findByIdAndUpdate(id, { serviceName, description, price, image: { url: path, filename } }, { new: true });
        return res.status(200).json({ "Message": `Details of ${result.serviceName} updated successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.deleteServiceController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Service.findByIdAndDelete(id);
        await cloudinary.uploader.destroy(result.image.filename);
        return res.status(200).json({ "Message": `Service ${result.serviceName} deleted successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};