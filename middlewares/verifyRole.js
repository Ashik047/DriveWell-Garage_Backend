
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.payload?.role) {
            return res.status(401).json({ "Message": "Access denied. Please log in to continue." });
        }
        const { role } = req.payload;
        const result = allowedRoles.some(event => event === role);
        if (!result) {
            return res.status(403).json({ "Message": "You do not have access to perform this action." });
        }
        next();
    }
}

module.exports = verifyRole;