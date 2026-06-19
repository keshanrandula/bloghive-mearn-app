const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { getNotifications, markNotificationsAsRead } = require('../controllers/notificationController');

router.get('/', verifyToken, getNotifications);
router.put('/read', verifyToken, markNotificationsAsRead);

module.exports = router;
