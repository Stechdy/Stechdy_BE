const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get active session (currently studying)
router.get('/active', studySessionController.getActiveSession);

// Get upcoming sessions by subject (for dashboard)
router.get('/upcoming-by-subject', studySessionController.getUpcomingSessionsBySubject);

// Get weekly schedule (for study tracker)
router.get('/week', studySessionController.getWeeklySchedule);

// Get sessions by date range (for monthly view)
router.get('/range', studySessionController.getSessionsByRange);

// Get today's sessions (for dashboard)
router.get('/today', studySessionController.getTodaySessions);

// Get study statistics
router.get('/stats', studySessionController.getStudyStats);

// Get all study sessions with filters
router.get('/', studySessionController.getStudySessions);

// Get sessions by subject (for subject detail page)
router.get('/subject/:subjectId', studySessionController.getSessionsBySubject);

// Get a single study session
router.get('/:id', studySessionController.getStudySession);

// Create a new study session
router.post('/', studySessionController.createStudySession);

// Update a study session
router.put('/:id', studySessionController.updateStudySession);

// Complete a study session
router.post('/:id/complete', studySessionController.completeStudySession);

// Pause a study session
router.post('/:id/pause', studySessionController.pauseSession);

// Resume a study session
router.post('/:id/resume', studySessionController.resumeSession);

// End a study session manually
router.post('/:id/end', studySessionController.endSession);

// Reschedule a study session
router.post('/:id/reschedule', studySessionController.rescheduleStudySession);

// Delete a study session
router.delete('/:id', studySessionController.deleteStudySession);

module.exports = router;
