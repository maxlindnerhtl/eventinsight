require('dotenv').config();

const bcrypt = require('bcryptjs');
const connection = require('../db');

const username = process.env.SEED_ADMIN_USERNAME?.trim();
const password = process.env.SEED_ADMIN_PASSWORD;
const SALT_ROUNDS = 10;

const finish = (exitCode) => {
    connection.end(() => {
        process.exitCode = exitCode;
    });
};

if (!username || !password) {
    console.error('SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set.');
    finish(1);
} else {
    connection.query(
        'SELECT idadmindata FROM Admins WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('Failed to check whether the admin already exists:', err);
                return finish(1);
            }

            if (results.length > 0) {
                console.error(`Admin "${username}" already exists. No account was created.`);
                return finish(1);
            }

            bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
                if (err) {
                    console.error('Failed to hash the admin password:', err);
                    return finish(1);
                }

                connection.query(
                    'INSERT INTO Admins (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    (err) => {
                        if (err) {
                            console.error('Failed to create the seed admin:', err);
                            return finish(1);
                        }

                        console.log(`Seed admin "${username}" created successfully.`);
                        finish(0);
                    }
                );
            });
        }
    );
}
