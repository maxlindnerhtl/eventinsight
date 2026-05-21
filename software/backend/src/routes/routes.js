const express = require('express');
const router = express.Router();

const eventsRoutes = require('./events');
const adminsRoutes = require('./admins');
const filesRoutes = require('./files');
const authRoutes = require('./authRoutes');

router.use('/events', eventsRoutes);
router.use('/admins', adminsRoutes);
router.use('/files', filesRoutes);
router.use('/auth', authRoutes);

module.exports = router;
