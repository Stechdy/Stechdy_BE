const express = require('express');
const router = express.Router();
const deadlineController = require('../controllers/deadlineController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all deadlines
router.get('/', deadlineController.getDeadlines);

// Get deadlines by subject
router.get('/subject/:subjectId', deadlineController.getDeadlinesBySubject);

// Get upcoming deadlines
router.get('/upcoming', deadlineController.getUpcomingDeadlines);

// Get a single deadline
router.get('/:id', deadlineController.getDeadline);

// Create a new deadline
router.post('/', deadlineController.createDeadline);

// Update a deadline
router.put('/:id', deadlineController.updateDeadline);

// Complete a deadline
router.post('/:id/complete', deadlineController.completeDeadline);

// Delete a deadline
router.delete('/:id', deadlineController.deleteDeadline);

module.exports = router;
