require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes/routes');
const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Verfügbare Routen:",
        routes: [
            {path: '/events', description: 'Liste der Events'},
            {path: '/admins', description: 'Admin-Informationen'},
            {path: '/files', description: 'Hochladen von Dateien'},
            {path: '/lists', description: 'Liste der Listen'}
        ]
    });
});

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});