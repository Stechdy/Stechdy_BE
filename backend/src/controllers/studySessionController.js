const { StudySessionSchedule, Subject, StudyTimetable, Semester } = require('../models');

// Get upcoming sessions by subject (for Dashboard)
exports.getUpcomingSessionsBySubject = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    console.log('📚 Fetching upcoming sessions by subject for user:', userId);

    // Find active semester
    const activeSemester = await Semester.findOne({ 
      userId, 
      isActive: true 
    }).lean();

    if (!activeSemester) {
      return res.json([]);
    }

    // Get all subjects in current semester
    const subjects = await Subject.find({
      userId,
      semesterId: activeSemester._id,
      isArchived: false
    }).lean();

    if (subjects.length === 0) {
      return res.json([]);
    }

    const subjectIds = subjects.map(s => s._id);

    // Get next session for each subject
    const upcomingSessions = [];
    
    for (const subject of subjects) {
      const nextSession = await StudySessionSchedule.findOne({
        userId,
        subjectId: subject._id,
        date: { $gte: now },
        status: { $in: ['scheduled', 'in_progress'] }
      })
      .sort({ date: 1, startTime: 1 })
      .lean();

      if (nextSession) {
        upcomingSessions.push({
          ...nextSession,
          subjectInfo: {
            _id: subject._id,
            subjectName: subject.subjectName,
            color: subject.color,
            subjectCode: subject.subjectCode
          }
        });
      }
    }

    console.log(`✅ Found ${upcomingSessions.length} upcoming sessions for ${subjects.length} subjects`);

    res.json(upcomingSessions);
  } catch (error) {
    console.error('❌ Error fetching upcoming sessions by subject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get today's study sessions
exports.getTodaySessions = async (req, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.user._id;

    console.log('📅 Fetching today sessions for user:', userId);
    console.log('📅 Date range:', { start, end });

    const query = {
      userId,
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    };

    const sessions = await StudySessionSchedule.find(query)
      .populate('subjectId', 'subjectName color subjectCode')
      .populate('timetableId', 'status')
      .sort({ startTime: 1 })
      .lean();

    console.log(`✅ Found ${sessions.length} sessions for today`);

    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching today sessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all study sessions for a date range
exports.getStudySessions = async (req, res) => {
  try {
    const { startDate, endDate, status, subjectId } = req.query;
    const userId = req.user._id;

    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }

    const sessions = await StudySessionSchedule.find(query)
      .populate('subjectId', 'subjectName color subjectCode instructor')
      .populate('timetableId', 'status generatedBy')
      .sort({ date: -1, startTime: 1 })
      .lean();

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single study session
exports.getStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySessionSchedule.findOne({ _id: id, userId })
      .populate('subjectId', 'subjectName color subjectCode instructor syllabus')
      .populate('timetableId')
      .lean();

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new study session (manual)
exports.createStudySession = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      timetableId,
      subjectId,
      date,
      sessionType,
      startTime,
      endTime,
      topic,
      objectives,
      plannedDuration,
      notes
    } = req.body;

    // Validate required fields
    if (!subjectId || !date || !sessionType || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: subjectId, date, sessionType, startTime, endTime' 
      });
    }

    // Check max 3 sessions per day
    const sessionDate = new Date(date);
    const existingSessionsCount = await StudySessionSchedule.countDocuments({
      userId,
      date: {
        $gte: new Date(sessionDate.setHours(0, 0, 0, 0)),
        $lte: new Date(sessionDate.setHours(23, 59, 59, 999))
      }
    });

    if (existingSessionsCount >= 3) {
      return res.status(400).json({ 
        message: 'Maximum 3 study sessions per day allowed' 
      });
    }

    const newSession = await StudySessionSchedule.create({
      timetableId,
      userId,
      subjectId,
      date,
      dayOfWeek: new Date(date).getDay(),
      sessionType,
      startTime,
      endTime,
      topic,
      objectives: objectives || [],
      plannedDuration: plannedDuration || 90,
      notes,
      status: 'scheduled',
      isUserEdited: false
    });

    const populatedSession = await StudySessionSchedule.findById(newSession._id)
      .populate('subjectId', 'subjectName color subjectCode')
      .lean();

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a study session
exports.updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const session = await StudySessionSchedule.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Track if this is a user edit
    if (['date', 'startTime', 'endTime', 'topic', 'sessionType'].some(field => updates[field])) {
      updates.isUserEdited = true;
      
      // Add to edit history
      const editFields = Object.keys(updates).filter(f => f !== 'isUserEdited');
      editFields.forEach(field => {
        if (session[field] !== updates[field]) {
          session.editHistory.push({
            editedAt: new Date(),
            field,
            oldValue: session[field],
            newValue: updates[field]
          });
        }
      });
    }

    // Update session
    Object.assign(session, updates);
    await session.save();

    const updatedSession = await StudySessionSchedule.findById(id)
      .populate('subjectId', 'subjectName color subjectCode')
      .lean();

    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Complete a study session
exports.completeStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { focusLevel, notes, completedTopics, actualDuration, wasProductived } = req.body;

    const session = await StudySessionSchedule.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Use the complete method from the model
    await session.complete(focusLevel, notes, completedTopics, actualDuration, wasProductived);

    const updatedSession = await StudySessionSchedule.findById(id)
      .populate('subjectId', 'subjectName color subjectCode')
      .lean();

    res.json(updatedSession);
  } catch (error) {
    console.error('Error completing study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reschedule a study session
exports.rescheduleStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { newDate, newStartTime, newEndTime, reason } = req.body;

    if (!newDate || !newStartTime || !newEndTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: newDate, newStartTime, newEndTime' 
      });
    }

    const session = await StudySessionSchedule.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Check max 3 sessions per day for new date
    const newSessionDate = new Date(newDate);
    const existingSessionsCount = await StudySessionSchedule.countDocuments({
      userId,
      _id: { $ne: id },
      date: {
        $gte: new Date(newSessionDate.setHours(0, 0, 0, 0)),
        $lte: new Date(newSessionDate.setHours(23, 59, 59, 999))
      }
    });

    if (existingSessionsCount >= 3) {
      return res.status(400).json({ 
        message: 'Maximum 3 study sessions per day allowed on the new date' 
      });
    }

    // Use the reschedule method from the model
    await session.reschedule(newDate, newStartTime, newEndTime, reason);

    const updatedSession = await StudySessionSchedule.findById(id)
      .populate('subjectId', 'subjectName color subjectCode')
      .lean();

    res.json(updatedSession);
  } catch (error) {
    console.error('Error rescheduling study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a study session
exports.deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySessionSchedule.findOneAndDelete({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ message: 'Study session deleted successfully' });
  } catch (error) {
    console.error('Error deleting study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get study statistics
exports.getStudyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sessions = await StudySessionSchedule.find(query).lean();

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalPlannedMinutes: sessions.reduce((sum, s) => sum + (s.plannedDuration || 90), 0),
      totalActualMinutes: sessions
        .filter(s => s.actualDuration)
        .reduce((sum, s) => sum + s.actualDuration, 0),
      averageFocusLevel: sessions
        .filter(s => s.focusLevel)
        .reduce((sum, s, _, arr) => sum + s.focusLevel / arr.length, 0),
      bySubject: {}
    };

    // Group by subject
    sessions.forEach(session => {
      const subjectId = session.subjectId?.toString();
      if (!subjectId) return;

      if (!stats.bySubject[subjectId]) {
        stats.bySubject[subjectId] = {
          count: 0,
          completedCount: 0,
          totalMinutes: 0
        };
      }

      stats.bySubject[subjectId].count++;
      if (session.status === 'completed') {
        stats.bySubject[subjectId].completedCount++;
        stats.bySubject[subjectId].totalMinutes += session.actualDuration || session.plannedDuration || 90;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching study stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
