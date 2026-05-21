const express = require('express');
const router = express.Router();
const connection = require('../db');
const bcrypt = require('bcryptjs');
const errorHandler = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');
const secretKey = 'b8d1f7b9-7f1c-4b99-ae82-7a2d42e0d3d8\n';

router.get('/', (req, res) => {
    connection.query('SELECT idadmindata, password, username FROM Admins', (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.json(results);
    });
});

router.post('/createAdmin', (req, res) => {
    const {username, password} = req.body;

    connection.query('SELECT * FROM Admins WHERE username = ?', [username], (err, result) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        if (result.length > 0) return errorHandler.handleValidationError('Benutzername bereits vergeben', res);

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return errorHandler.handleDatabaseError(err, res);

            connection.query('INSERT INTO Admins (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).json({message: 'Admin erfolgreich erstellt!'});
            });
        });
    });
});

router.post('/login', (req, res) => {
    const {username, password} = req.body;

    connection.query('SELECT * FROM Admins WHERE username = ?', [username], (err, result) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        if (result.length === 0) return errorHandler.handleValidationError('Benutzername nicht gefunden', res);

        bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            if (!isMatch) return errorHandler.handleValidationError('Falsches Passwort', res);

            const token = jwt.sign({
                id: result[0].idadmindata,
                username: result[0].username
            }, secretKey, {expiresIn: '1h'});

            res.status(200).json({
                message: 'Login erfolgreich!',
                token,
                username: result[0].username,
                adminid: result[0].idadmindata,
            });
        });
    });
});

router.post('/checkEventAccess', (req, res) => {
    const {adminid, eventid} = req.body;
    if (!adminid || !eventid) return errorHandler.handleValidationError('Admin ID und Event ID sind erforderlich', res);

    connection.query('SELECT * FROM AdminEventAccess WHERE adminid = ? AND eventid = ?', [adminid, eventid], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.json({access: results.length > 0});
    });
});

router.get('/me', (req, res) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({message: 'Kein Token gefunden'});

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return res.status(403).json({message: 'Ungültiges Token'});

        connection.query('SELECT username FROM Admins WHERE idadmindata = ?', [decoded.id], (err, results) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            if (results.length > 0) res.json({username: results[0].username});
            else res.status(404).json({message: 'Admin nicht gefunden'});
        });
    });
});

module.exports = router;