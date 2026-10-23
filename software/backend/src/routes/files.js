const express = require('express');
const router = express.Router();
const connection = require('../db');
const errorHandler = require('../utils/errorHandler');
const authenticateToken = require('../utils/authenticateToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Utility functions
const createUploadPath = (pathName) => {
    if (!fs.existsSync(pathName)) fs.mkdirSync(pathName, {recursive: true});
};

// Returns a safe positive integer or null
const parseId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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

// Sponsor images: allowed MIME types with their extensions and magic bytes
const sponsorImageTypes = {
    'image/jpeg': {extensions: ['.jpg', '.jpeg'], magic: [0xFF, 0xD8, 0xFF]},
    'image/png': {extensions: ['.png'], magic: [0x89, 0x50, 0x4E, 0x47]},
    'image/gif': {extensions: ['.gif'], magic: [0x47, 0x49, 0x46, 0x38]},
};
const SPONSOR_MAX_SIZE = 5 * 1024 * 1024;

const sponsorUpload = multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => cb(null, sponsorUploadPath),
        // Server-generated name: no overwrites, no user-controlled characters in the path
        filename: (_, file, cb) => cb(null, `${crypto.randomUUID()}${sponsorImageTypes[file.mimetype].extensions[0]}`)
    }),
    fileFilter: (_, file, cb) => {
        const type = sponsorImageTypes[file.mimetype];
        const extension = path.extname(file.originalname).toLowerCase();
        if (!type || !type.extensions.includes(extension)) {
            return cb(new Error('Ungültiger Dateityp. Erlaubt sind JPG, PNG und GIF.'));
        }
        if (file.originalname.length > 255) {
            return cb(new Error('Dateiname darf höchstens 255 Zeichen lang sein.'));
        }
        cb(null, true);
    },
    limits: {fileSize: SPONSOR_MAX_SIZE},
});

const hasImageSignature = (filePath, mimetype) => {
    const {magic} = sponsorImageTypes[mimetype];
    const buffer = Buffer.alloc(magic.length);
    const fd = fs.openSync(filePath, 'r');
    try {
        const bytesRead = fs.readSync(fd, buffer, 0, magic.length, 0);
        return bytesRead === magic.length && magic.every((byte, i) => buffer[i] === byte);
    } finally {
        fs.closeSync(fd);
    }
};

const removeUploadedFile = (file) => {
    if (!file) return;
    fs.unlink(file.path, (err) => {
        if (err) console.error('Hochgeladene Datei konnte nicht gelöscht werden:', err);
    });
};

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
router.post('/results/upload', authenticateToken, (req, res) => {
    const {listname, listlink, eventid, idlivemap} = req.body;

    if (!listname || !listlink || !eventid || !idlivemap) {
        return errorHandler.handleValidationError(
            'Missing parameters: listname, listlink, eventid, or idlivemap.',
            res
        );
    }

    if (typeof listname !== 'string' || listname.length > 255) {
        return errorHandler.handleValidationError(
            'Listenname muss ein Text mit höchstens 255 Zeichen sein.',
            res
        );
    }

    if (
        typeof listlink !== 'string' ||
        listlink.length > 255 ||
        !/^https:\/\/api\.raceresult\.com\/\d+\/[A-Za-z0-9]+$/.test(listlink)
    ) {
        return errorHandler.handleValidationError(
            'Listenlink muss ein gültiger Race-Result-API-Link mit höchstens 255 Zeichen sein.',
            res
        );
    }

    const parsedEventId = parseId(eventid);
    const parsedLiveMapId = parseId(idlivemap);
    if (!parsedEventId || !parsedLiveMapId) {
        return errorHandler.handleValidationError(
            'Event-ID und LiveMap-ID müssen gültige Zahlen sein.',
            res
        );
    }

    connection.query(
        'INSERT INTO SimpleAPI (listname, listlink, eventid, idlivemap) VALUES (?, ?, ?, ?)',
        [listname, listlink, parsedEventId, parsedLiveMapId],
        (err) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            res.status(200).send('API-Link erfolgreich hochgeladen und mit LiveMap verbunden.');
        }
    );
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
router.delete('/sponsors/delete', authenticateToken, (req, res) => {
    const {id} = req.body;
    if (!id) return errorHandler.handleValidationError('Missing sponsor ID', res);

    const sponsorId = parseId(id);
    if (!sponsorId) return errorHandler.handleValidationError('Sponsor-ID muss eine gültige Zahl sein.', res);

    connection.query('DELETE FROM Sponsors WHERE idSponsors = ?', [sponsorId], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json({message: 'Sponsor deleted successfully'});
    });
});

router.post('/sponsors/upload', authenticateToken, (req, res) => {
    sponsorUpload.single('sponsorFile')(req, res, (err) => {
        if (err) {
            removeUploadedFile(req.file);
            const message = err.code === 'LIMIT_FILE_SIZE' ? 'Datei ist zu groß (max. 5 MB).' : err.message;
            return errorHandler.handleValidationError(message, res);
        }

        const {file, body: {sponsorname, eventid}} = req;
        const rejectUpload = (message) => {
            removeUploadedFile(file);
            errorHandler.handleValidationError(message, res);
        };

        if (!file || !sponsorname || !eventid) return rejectUpload('Missing file, sponsor name, or Event ID.');

        if (typeof sponsorname !== 'string' || !sponsorname.trim() || sponsorname.length > 255) {
            return rejectUpload('Sponsorname darf nicht leer sein und höchstens 255 Zeichen haben.');
        }

        const parsedEventId = parseId(eventid);
        if (!parsedEventId) return rejectUpload('Event-ID muss eine gültige Zahl sein.');

        let isImage;
        try {
            isImage = hasImageSignature(file.path, file.mimetype);
        } catch (readErr) {
            console.error('Hochgeladene Datei konnte nicht gelesen werden:', readErr);
            isImage = false;
        }
        if (!isImage) return rejectUpload('Datei ist kein gültiges Bild.');

        const filePath = path.join('uploads/sponsors', file.filename);
        connection.query('INSERT INTO Sponsors (sponsorname, sponsorpath, eventid, is_displayed) VALUES (?, ?, ?, 0)', [sponsorname, filePath, parsedEventId], (err) => {
            if (err) {
                removeUploadedFile(file);
                return errorHandler.handleDatabaseError(err, res);
            }
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

router.post('/sponsors/updateDisplay', authenticateToken, (req, res) => {
    const {eventid, displayedSponsors} = req.body;
    if (!eventid || !Array.isArray(displayedSponsors)) return errorHandler.handleValidationError('Invalid input.', res);

    const parsedEventId = parseId(eventid);
    if (!parsedEventId) return errorHandler.handleValidationError('Event-ID muss eine gültige Zahl sein.', res);

    const sponsorIds = displayedSponsors.map(parseId);
    if (sponsorIds.some((sponsorId) => sponsorId === null)) {
        return errorHandler.handleValidationError('Sponsor-IDs müssen gültige Zahlen sein.', res);
    }

    connection.query('UPDATE Sponsors SET is_displayed = 0 WHERE eventid = ?', [parsedEventId], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        if (sponsorIds.length > 0) {
            const placeholders = sponsorIds.map(() => '?').join(',');
            connection.query(`UPDATE Sponsors
                              SET is_displayed = 1
                              WHERE idSponsors IN (${placeholders})`, sponsorIds, (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Anzeige der Bilder erfolgreich aktualisiert');
            });
        } else {
            res.status(200).send('Anzeige der Bilder erfolgreich aktualisiert');
        }
    });
});

// Intermediate Times routes
// Returns a finite number within [min, max] or null
const parseCoordinate = (value, min, max) => {
    if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

router.post('/intermediateTimes/add', authenticateToken, (req, res) => {
    const {idlivemap, latitude, longitude} = req.body;

    if (idlivemap == null || latitude == null || longitude == null) {
        return errorHandler.handleValidationError('Fehlende Werte: idlivemap, latitude, longitude.', res);
    }

    const parsedLiveMapId = parseId(idlivemap);
    if (!parsedLiveMapId) return errorHandler.handleValidationError('LiveMap-ID muss eine gültige Zahl sein.', res);

    const parsedLatitude = parseCoordinate(latitude, -90, 90);
    const parsedLongitude = parseCoordinate(longitude, -180, 180);
    if (parsedLatitude === null || parsedLongitude === null) {
        return errorHandler.handleValidationError('Breitengrad muss zwischen -90 und 90, Längengrad zwischen -180 und 180 liegen.', res);
    }

    connection.query(
        'INSERT INTO IntermediateTimes (idlivemap, latitude, longitude) VALUES (?, ?, ?)',
        [parsedLiveMapId, parsedLatitude, parsedLongitude],
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

router.delete('/intermediateTimes/delete', authenticateToken, (req, res) => {
    const {id} = req.query;
    if (!id) return res.status(400).json({error: "Marker ID fehlt."});

    const markerId = parseId(id);
    if (!markerId) return errorHandler.handleValidationError('Marker-ID muss eine gültige Zahl sein.', res);

    connection.query(
        'DELETE FROM IntermediateTimes WHERE idintermediatetimes = ?',
        [markerId],
        (err) => {
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

const TEXT_MAX_LENGTH = 50000;

router.post('/text/upload', authenticateToken, (req, res) => {
    const {idtext, text, eventid} = req.body;
    if (!idtext || !text || !eventid) {
        return errorHandler.handleValidationError('Missing parameters: idtext, text, or eventid.', res);
    }

    const parsedTextId = parseId(idtext);
    const parsedEventId = parseId(eventid);
    if (!parsedTextId || !parsedEventId) {
        return errorHandler.handleValidationError('Text-ID und Event-ID müssen gültige Zahlen sein.', res);
    }

    // Mirrors the frontend check in EditText.jsx: text must not be empty once tags are stripped
    if (typeof text !== 'string' || !text.replace(/<\/?[^>]+(>|$)/g, '').trim()) {
        return errorHandler.handleValidationError('Text darf nicht leer sein.', res);
    }

    if (text.length > TEXT_MAX_LENGTH) {
        return errorHandler.handleValidationError(`Text darf höchstens ${TEXT_MAX_LENGTH} Zeichen lang sein.`, res);
    }

    connection.query('SELECT * FROM Text WHERE idtext = ?', [parsedTextId], (err, results) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        if (results.length > 0) {
            connection.query('UPDATE Text SET text = ? WHERE idtext = ?', [text, parsedTextId], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Text successfully updated.');
            });
        } else {
            connection.query('INSERT INTO Text (idtext, text, eventid) VALUES (?, ?, ?)', [parsedTextId, text, parsedEventId], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);
                res.status(200).send('Text successfully uploaded.');
            });
        }
    });
});

module.exports = router;