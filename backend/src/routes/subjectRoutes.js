const express = require('express');
const router = express.Router();
const { getSubjects } = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSubjects);

module.exports = router;
