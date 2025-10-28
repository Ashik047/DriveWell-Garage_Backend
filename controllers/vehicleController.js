const Vehicle = require("../models/vehicleModel");
const Joi = require("joi");

exports.getMyVehiclesController = async (req, res) => {
    const { userName } = req.payload;
    const { type } = req.query;
    const filter = {};
    if (type) {
        filter[type] = 1;
    }
    try {
        const myVehicles = await Vehicle.find({ owner: userName }, filter);
        return res.status(200).json(myVehicles);

    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.addVehicleController = async (req, res) => {
    const reqBodySchema = Joi.object({
        vehicle: Joi.string().required(),
        year: Joi.number().required(),
        plate: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { vehicle, year, plate } = req.body;
    const plateRegex = /^[A-Z]{2}\s?\d?[1-9]\s?[A-Z][A-Z]?\s?\d{4}/g;
    if (!plateRegex.test(plate)) {
        return res.status(400).json({ "Message": "Invalid License." });
    }
    try {
        const foundVehicle = await Vehicle.findOne({ plate });
        if (foundVehicle) {
            return res.status(409).json({ "Message": "Vehicle already exists." });
        }
        const { userName } = req.payload;
        const newVehicle = new Vehicle({ vehicle, owner: userName, year, plate });
        await newVehicle.save();
        return res.status(200).json({ "Message": "Vehicle added successfully." });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.editVehicleController = async (req, res) => {
    const { id } = req.params;
    const reqBodySchema = Joi.object({
        vehicle: Joi.string().required(),
        year: Joi.number().required(),
        plate: Joi.string().required()
    }).required();
    const { error } = reqBodySchema.validate(req.body);
    if (error) {
        const errMessage = error.details.map(event => event.message).join(",");
        return res.status(400).json({ "Message": errMessage });
    }
    const { vehicle, year, plate } = req.body;
    const plateRegex = /^[A-Z]{2}\s?\d?[1-9]\s?[A-Z][A-Z]?\s?\d{4}/g;
    if (!plateRegex.test(plate)) {
        return res.status(400).json({ "Message": "Invalid License Plate." });
    }
    try {
        const { userName } = req.payload;
        const foundVehicle = await Vehicle.findOneAndUpdate({ _id: id, owner: userName }, { vehicle, year, plate }, { new: true });
        if (!foundVehicle) {
            return res.status(404).json({ "Message": "Vehicle not found." });
        }
        return res.status(200).json({ "Message": `Vehicle details of ${foundVehicle.vehicle} updated successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};

exports.deleteVehicleController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Vehicle.findByIdAndDelete(id);
        return res.status(200).json({ "Message": `Vehicle details of ${result.vehicle} deleted successfully.` });
    } catch (err) {
        return res.status(500).json({ "Message": "Something went wrong." });
    }
};