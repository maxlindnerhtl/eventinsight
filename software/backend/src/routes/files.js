const express = require('express');
const router = express.Router();
const connection = require('../db');
const errorHandler = require('../utils/errorHandler');
const authenticateToken = require('../utils/authenticateToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Utility functions
const createUploadPath = (pathName) => {
    if (!fs.existsSync(pathName)) fs.mkdirSync(pathName, {recursive: true});
};

const configureMulter = (storagePath, allowedTypes, sizeLimit) => multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => cb(null, storagePath),
        filename: (_, file, cb) => cb(null, file.originalname)
    }),
    fileFilter: (_, file, cb) => {
        if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type'));
    },
    limits: {fileSize: sizeLimit},
});

const uploadPath = path.join(__dirname, '../uploads/livemaps');
const sponsorUploadPath = path.join(__dirname, '../uploads/sponsors');
createUploadPath(uploadPath);
createUploadPath(sponsorUploadPath);

const upload = configureMulter(uploadPath, [], 10 * 1024 * 1024);
const sponsorUpload = configureMulter(sponsorUploadPath, ['image/jpeg', 'image/png', 'image/gif'], 5 * 1024 * 1024);

// Map routes
router.put('/livemap/update', authenticateToken, (req, res) => {
    const {id, field, value} = req.body;
    if (!id || !field || !value) return errorHandler.handleValidationError('Missing parameters', res);

    const allowedFields = ['mapname', 'maptime'];
    if (!allowedFields.includes(field)) {
        return errorHandler.handleValidationError('Invalid map field', res);
    }

    if (field === 'maptime' && !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)) {
        return errorHandler.handleValidationError('Invalid map time format. Expected HH:MM:SS.', res);
    }

    connection.query(`UPDATE LiveMap
                      SET ${field} = ?
                      WHERE idlivemap = ?`, [value, id], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json({message: 'Map updated successfully'});
    });
});

router.delete('/livemap/delete', authenticateToken, (req, res) => {
    const {id} = req.body;
    if (!id) return errorHandler.handleValidationError('Missing map ID', res);

    connection.query('DELETE FROM IntermediateTimes WHERE idlivemap = ?', [id], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        connection.query('DELETE FROM SimpleAPI WHERE idlivemap = ?', [id], (err) => {
            if (err) return errorHandler.handleDatabaseError(err, res);

            connection.query('DELETE FROM LiveMap WHERE idlivemap = ?', [id], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).json({message: 'Map and related data deleted successfully'});
            });
        });
    });
});

router.post('/livemap/upload', authenticateToken, upload.single('LiveMap'), (req, res) => {
    const {file, body: {eventid, mapname, maptime}} = req;
    if (!file || !eventid || !mapname || !maptime) return errorHandler.handleValidationError('Fehlende Datei, Event ID, Kartennamen oder Zeit.', res);

    const filePath = path.join('uploads/livemaps', file.filename);
    connection.query('INSERT INTO LiveMap (mapname, mappath, eventid, maptime) VALUES (?, ?, ?, ?)', [mapname, filePath, eventid, maptime], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).send('GPX-Datei erfolgreich hochgeladen');
    });
});

router.get('/livemap/details/:eventid', (req, res) => {
    const eventId = req.params.eventid;
    if (!eventId) return errorHandler.handleValidationError('Event ID is required.', res);

    connection.query('SELECT mapname, maptime FROM LiveMap WHERE eventid = ?', [eventId], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        if (results.length === 0) return res.status(404).json({error: 'No map details found for this event ID.'});
        res.status(200).json(results[0]);
    });
});

router.get('/livemap', (req, res) => {
    const eventId = req.query.eventid;
    if (!eventId) return errorHandler.handleValidationError('Event ID is required.', res);

    connection.query('SELECT idlivemap, mapname, mappath, maptime FROM LiveMap WHERE eventid = ?', [eventId], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json(results);
    });
});

//Result routes
router.post('/results/upload', (req, res) => {
    const {listname, listlink, eventid, idlivemap} = req.body;
    if (!listname || !listlink || !eventid || !idlivemap) return errorHandler.handleValidationError('Missing parameters: listname, listlink, eventid, or idlivemap.', res);
    connection.query('INSERT INTO SimpleAPI (listname, listlink, eventid, idlivemap) VALUES (?, ?, ?, ?)', [listname, listlink, eventid, idlivemap], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).send('API-Link erfolgreich hochgeladen und mit LiveMap verbunden.');
    });
});

router.get('/results/fetch', (req, res) => {
    const eventId = req.query.eventid;
    if (!eventId) return res.status(400).json({error: 'Event ID is required.'});

    connection.query('SELECT listname, listlink FROM SimpleAPI WHERE eventid = ?', [eventId], (err, results) => {
        if (err) return res.status(500).json({error: 'Database query failed.'});
        res.json(results);
    });
});

router.get('/results/fetchFromMap', (req, res) => {
    const {mapId} = req.query;
    if (!mapId) return res.status(400).json({error: 'Map ID is required.'});

    connection.query('SELECT listlink FROM SimpleAPI WHERE idlivemap = ?', [mapId], (err, results) => {
        if (err) return res.status(500).json({error: 'Database query failed.'});
        if (results.length === 0) return res.status(404).json({error: 'API link not found for this map ID.'});
        res.json(results[0]);
    });
});

// Sponsor routes
router.delete('/sponsors/delete', (req, res) => {
    const {id} = req.body;
    if (!id) return errorHandler.handleValidationError('Missing sponsor ID', res);

    connection.query('DELETE FROM Sponsors WHERE idSponsors = ?', [id], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json({message: 'Sponsor deleted successfully'});
    });
});

router.post('/sponsors/upload', (req, res) => {
    sponsorUpload.single('sponsorFile')(req, res, (err) => {
        if (err) return errorHandler.handleValidationError(err.message, res);

        const {file, body: {sponsorname, eventid}} = req;
        if (!file || !sponsorname || !eventid) return errorHandler.handleValidationError('Missing file, sponsor name, or Event ID.', res);

        const filePath = path.join('uploads/sponsors', file.filename);
        connection.query('INSERT INTO Sponsors (sponsorname, sponsorpath, eventid, is_displayed) VALUES (?, ?, ?, 0)', [sponsorname, filePath, eventid], (err) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            res.status(200).send('Sponsorenbild erfolgreich hochgeladen');
        });
    });
});

router.get('/sponsors', (req, res) => {
    const eventId = req.query.eventid;
    if (!eventId) return errorHandler.handleValidationError('Event ID is required.', res);

    connection.query('SELECT idSponsors, sponsorname, sponsorpath, is_displayed FROM Sponsors WHERE eventid = ?', [eventId], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json(results);
    });
});

router.post('/sponsors/updateDisplay', (req, res) => {
    const {eventid, displayedSponsors} = req.body;
    if (!eventid || !Array.isArray(displayedSponsors)) return errorHandler.handleValidationError('Invalid input.', res);

    connection.query('UPDATE Sponsors SET is_displayed = 0 WHERE eventid = ?', [eventid], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        if (displayedSponsors.length > 0) {
            const placeholders = displayedSponsors.map(() => '?').join(',');
            connection.query(`UPDATE Sponsors
                              SET is_displayed = 1
                              WHERE idSponsors IN (${placeholders})`, displayedSponsors, (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Anzeige der Bilder erfolgreich aktualisiert');
            });
        } else {
            res.status(200).send('Anzeige der Bilder erfolgreich aktualisiert');
        }
    });
});

// Intermediate Times routes
router.post('/intermediateTimes/add', (req, res) => {
    const {idlivemap, latitude, longitude} = req.body;

    if (!idlivemap || !latitude || !longitude) {
        return errorHandler.handleValidationError('Fehlende Werte: idlivemap, latitude, longitude.', res);
    }

    connection.query(
        'INSERT INTO IntermediateTimes (idlivemap, latitude, longitude) VALUES (?, ?, ?)',
        [idlivemap, latitude, longitude],
        (err, result) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            res.status(200).json({message: "Zwischenzeit erfolgreich gespeichert", id: result.insertId});
        }
    );
});

router.get('/intermediateTimes/getByMap', (req, res) => {
    const {idlivemap} = req.query;

    if (!idlivemap) {
        return errorHandler.handleValidationError('Map ID (idlivemap) ist erforderlich.', res);
    }

    connection.query(
        'SELECT idintermediatetimes, latitude, longitude FROM IntermediateTimes WHERE idlivemap = ?',
        [idlivemap],
        (err, results) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            res.status(200).json(results);
        }
    );
});

router.delete('/intermediateTimes/delete', (req, res) => {
    const {id} = req.query;
    if (!id) return res.status(400).json({error: "Marker ID fehlt."});

    connection.query(
        'DELETE FROM IntermediateTimes WHERE idintermediatetimes = ?',
        [id],
        (err, result) => {
            if (err) return res.status(500).json({error: "Fehler beim Löschen."});
            res.status(200).json({message: "Marker erfolgreich gelöscht."});
        }
    );
});

// Text routes
router.get('/text/fetch', (req, res) => {
    const {idtext} = req.query;
    if (!idtext) {
        return errorHandler.handleValidationError('Missing parameter: idtext.', res);
    }

    connection.query('SELECT text FROM Text WHERE idtext = ?', [idtext], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        if (results.length === 0) return res.status(200).json({text: ''});
        res.status(200).json(results[0]);
    });
});

router.post('/text/upload', (req, res) => {
    const {idtext, text, eventid} = req.body;
    if (!idtext || !text || !eventid) {
        return errorHandler.handleValidationError('Missing parameters: idtext, text, or eventid.', res);
    }

    connection.query('SELECT * FROM Text WHERE idtext = ?', [idtext], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        if (results.length > 0) {
            connection.query('UPDATE Text SET text = ? WHERE idtext = ?', [text, idtext], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Text successfully updated.');
            });
        } else {
            connection.query('INSERT INTO Text (idtext, text, eventid) VALUES (?, ?, ?)', [idtext, text, eventid], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Text successfully uploaded.');
            });
        }
    });
});

module.exports = router;