const jwt = require("jsonwebtoken");

const verifyUser = (req, res, next) => {

    const authHeader = req.headers.Authorization || req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) {
                return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
            }
            req.payload = {
                userId: decoded.UserInfo.userId,
                userName: decoded.UserInfo.userName,
                email: decoded.UserInfo.email,
                role: decoded.UserInfo.role
            }
            next();
        }
    )
}

module.exports = verifyUser;