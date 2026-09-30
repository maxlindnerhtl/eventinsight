const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const errorHandler = require('../utils/errorHandler');

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
    throw new Error('JWT_SECRET is not set');
}

router.get('/validateToken', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return errorHandler.handleValidationError('Authorization header is missing', res);

    const token = authHeader.split(' ')[1];
    if (!token) return errorHandler.handleValidationError('Token is missing', res);

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return errorHandler.handleValidationError('Invalid token', res);
        res.status(200).json({username: decoded.username});
    });
});

module.exports = router;