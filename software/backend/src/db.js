const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'eventinsight'
});

connection.connect((err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.stack);
        return;
    }
    console.log('Erfolgreich verbunden mit der Datenbank');
});

module.exports = connection;
