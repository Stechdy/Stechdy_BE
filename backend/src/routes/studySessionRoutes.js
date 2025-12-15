const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get upcoming sessions by subject (for dashboard)
router.get('/upcoming-by-subject', studySessionController.getUpcomingSessionsBySubject);

// Get today's sessions (for dashboard)
router.get('/today', studySessionController.getTodaySessions);

// Get study statistics
router.get('/stats', studySessionController.getStudyStats);

// Get all study sessions with filters
router.get('/', studySessionController.getStudySessions);

// Get a single study session
router.get('/:id', studySessionController.getStudySession);

// Create a new study session
router.post('/', studySessionController.createStudySession);

// Update a study session
router.put('/:id', studySessionController.updateStudySession);

// Complete a study session
router.post('/:id/complete', studySessionController.completeStudySession);

// Reschedule a study session
router.post('/:id/reschedule', studySessionController.rescheduleStudySession);

// Delete a study session
router.delete('/:id', studySessionController.deleteStudySession);

module.exports = router;
