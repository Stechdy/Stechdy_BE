const express = require('express');
const router = express.Router();
const { getSubjects, getSubjectById } = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSubjects);
router.get('/:id', protect, getSubjectById);

module.exports = router;
