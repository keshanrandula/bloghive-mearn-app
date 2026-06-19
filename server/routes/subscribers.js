const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const { subscribeNewsletter, getSubscribers } = require('../controllers/subscriberController');

router.post('/', subscribeNewsletter);
router.get('/', verifyToken, verifyAdmin, getSubscribers);

module.exports = router;
