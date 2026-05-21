const jwt = require('jsonwebtoken');
const errorHandler = require('../utils/errorHandler');
const secretKey = 'b8d1f7b9-7f1c-4b99-ae82-7a2d42e0d3d8';

const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return errorHandler.handleValidationError('Authorization header is missing', res);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return errorHandler.handleValidationError('Token is missing', res);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return errorHandler.handleValidationError('Invalid token', res);
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
