const multer = require('multer')
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "DriveWell Garage",                       // folder to be created in cloudinary to store the files
        allowedFormats: ["jpg", "jpeg", "png"]
    }
});

const uploadImage = multer({ storage });
module.exports = { uploadImage, cloudinary };