const express = require('express');
const router = express.Router();
const connection = require('../db');
const errorHandler = require('../utils/errorHandler');
const authenticateToken = require('../utils/authenticateToken');

// Event routes
router.get('/', (req, res) => {
    connection.query('SELECT idevents, eventname, DATE_FORMAT(eventdate, "%d.%m.%Y") AS formatted_date FROM Events',
        (err, results) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            res.json(results);
        }
    );
});

router.post('/add', authenticateToken, (req, res) => {
    const {eventname, eventdate, eventlocation, eventaddress, adminid} = req.body;

    const query = `
        INSERT INTO Events (eventname, eventdate, eventlocation, eventaddress)
        VALUES (?, ?, ?, ?)`;

    connection.query(query, [eventname, eventdate, eventlocation, eventaddress], (err, result) => {
        if (err) {
            return res.status(500).json({error: err});
        }

        const eventid = result.insertId;
        const accessQuery = `
            INSERT INTO AdminEventAccess (adminid, eventid)
            VALUES (?, ?)`;

        connection.query(accessQuery, [adminid, eventid], (err) => {
            if (err) {
                return res.status(500).json({message: 'Fehler beim Hinzufügen des Admin-Zugriffs', error: err});
            }

            res.status(200).json({message: 'Event erfolgreich hinzugefügt und Admin-Zugriff gesetzt'});
        });
    });
});

router.put('/updateEvent', authenticateToken, (req, res) => {
    const {id, field, value} = req.body;
    if (!id || !field || !value) return errorHandler.handleValidationError('Missing parameters', res);

    const allowedFields = ['eventname', 'eventdate', 'eventlocation', 'eventaddress'];
    if (!allowedFields.includes(field)) {
        return errorHandler.handleValidationError('Invalid event field', res);
    }

    if (field === 'eventdate' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return errorHandler.handleValidationError('Invalid event date format. Expected YYYY-MM-DD.', res);
    }

    connection.query(`UPDATE Events
                      SET ${field} = ?
                      WHERE idevents = ?`, [value, id], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);
        res.status(200).json({message: 'Event updated successfully'});
    });
});

router.delete('/deleteEvent', authenticateToken, (req, res) => {
    const {id} = req.body;
    if (!id) return errorHandler.handleValidationError('Missing event ID', res);

    connection.query('DELETE FROM Text WHERE eventid = ?', [id], (err) => {
        if (err) return errorHandler.handleDatabaseError(err, res);

        connection.query('DELETE FROM AdminEventAccess WHERE eventid = ?', [id], (err) => {
            if (err) return errorHandler.handleDatabaseError(err, res);

            connection.query('DELETE FROM SimpleAPI WHERE eventid = ?', [id], (err) => {
                if (err) return errorHandler.handleDatabaseError(err, res);

                connection.query(
                    `DELETE FROM IntermediateTimes
                     WHERE idlivemap IN (
                         SELECT idlivemap
                         FROM LiveMap
                         WHERE eventid = ?
                     )`,
                    [id],
                    (err) => {
                        if (err) return errorHandler.handleDatabaseError(err, res);

                        connection.query('DELETE FROM LiveMap WHERE eventid = ?', [id], (err) => {
                            if (err) return errorHandler.handleDatabaseError(err, res);

                            connection.query('DELETE FROM Sponsors WHERE eventid = ?', [id], (err) => {
                                if (err) return errorHandler.handleDatabaseError(err, res);

                                connection.query('DELETE FROM Events WHERE idevents = ?', [id], (err) => {
                                    if (err) return errorHandler.handleDatabaseError(err, res);
                                    res.status(200).json({message: 'Event deleted successfully'});
                                });
                            });
                        });
                    }
                );
            });
        });
    });
});

router.get('/:id', (req, res) => {
    connection.query('SELECT idevents, eventname,  eventaddress, eventlocation, eventdate, DATE_FORMAT(eventdate, "%d.%m.%Y") AS formatted_date FROM Events WHERE idevents = ?',
        [req.params.id],
        (err, results) => {
            if (err) return errorHandler.handleDatabaseError(err, res);
            if (!results.length) return errorHandler.handleValidationError('Event nicht gefunden', res);
            res.json(results[0]);
        }
    );
});

module.exports = router;