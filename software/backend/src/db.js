const mysql = require('mysql2');

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'eventinsight';

if (!dbPassword) {
    throw new Error('DB_PASSWORD is not set');
}

const connection = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName
});

connection.connect((err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.stack);
        return;
    }
    console.log('Erfolgreich verbunden mit der Datenbank');
});

module.exports = connection;
