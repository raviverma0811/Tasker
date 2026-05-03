const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticate }      = require('../middleware/auth');

const router = express.Router();
router.get('/', authenticate, getDashboardStats);

module.exports = router;
