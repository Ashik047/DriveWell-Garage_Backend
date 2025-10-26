const errorHandler = (err, req, res, next) => {
    res.status(500).send({ "Message": "Something went wrong." });
}

module.exports = errorHandler;