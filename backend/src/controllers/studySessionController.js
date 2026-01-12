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

// Get sessions by subject ID
exports.getSessionsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user._id;

    console.log('📚 Fetching sessions for subject:', subjectId);

    const sessions = await StudySessionSchedule.find({
      userId,
      subjectId
    })
      .populate('subjectId', 'subjectName color subjectCode')
      .sort({ date: -1, startTime: 1 })
      .lean();

    console.log(`✅ Found ${sessions.length} sessions for subject`);

    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching sessions by subject:', error);
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
    if (['date', 'startTime', 'endTime', 'sessionType'].some(field => updates[field])) {
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
    const { focusLevel, notes, completedTopics, actualDuration } = req.body;

    const session = await StudySessionSchedule.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Use the complete method from the model
    await session.complete(focusLevel, notes, completedTopics, actualDuration);

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

// Get active study session (the one user is currently studying)
exports.getActiveSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Tìm session đang học (đã confirm, có actualStartTime, chưa kết thúc)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const activeSession = await StudySessionSchedule.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow },
      actualStartTime: { $exists: true, $ne: null },
      actualEndTime: { $exists: false },
      status: { $ne: 'completed' }
    })
    .populate('subjectId', 'subjectName color subjectCode')
    .lean();
    
    if (!activeSession) {
      return res.json(null);
    }
    
    // Tính toán thời gian đã học và còn lại
    const actualStartTime = new Date(activeSession.actualStartTime);
    const pausedDuration = activeSession.pausedDuration || 0; // Phút đã pause
    
    // Parse endTime từ schema (format: "HH:MM")
    const [endHour, endMinute] = activeSession.endTime.split(':').map(Number);
    const plannedEndTime = new Date(activeSession.date);
    plannedEndTime.setHours(endHour, endMinute, 0, 0);
    
    // Thời gian đã học thực tế (trừ đi thời gian pause)
    const elapsedMs = now - actualStartTime - (pausedDuration * 60 * 1000);
    const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
    
    // Thời gian còn lại
    const remainingMs = plannedEndTime - now;
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)));
    
    // Tổng thời gian dự kiến
    const [startHour, startMinute] = activeSession.startTime.split(':').map(Number);
    const plannedStartTime = new Date(activeSession.date);
    plannedStartTime.setHours(startHour, startMinute, 0, 0);
    const totalPlannedMinutes = (plannedEndTime - plannedStartTime) / (1000 * 60);
    
    res.json({
      ...activeSession,
      elapsedMinutes,
      remainingMinutes,
      totalPlannedMinutes,
      isPaused: activeSession.isPaused || false,
      pausedDuration: pausedDuration
    });
  } catch (error) {
    console.error('❌ Error fetching active session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Pause active study session
exports.pauseSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const session = await StudySessionSchedule.findOne({ _id: id, userId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (!session.actualStartTime) {
      return res.status(400).json({ message: 'Session has not started yet' });
    }
    
    // Đánh dấu đang pause
    session.isPaused = true;
    session.pausedAt = new Date();
    await session.save();
    
    console.log(`⏸️ Session ${id} paused`);
    
    res.json({ success: true, message: 'Session paused', session });
  } catch (error) {
    console.error('❌ Error pausing session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resume paused study session
exports.resumeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const session = await StudySessionSchedule.findOne({ _id: id, userId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (!session.isPaused) {
      return res.status(400).json({ message: 'Session is not paused' });
    }
    
    // Tính thời gian đã pause và cộng vào pausedDuration
    const pausedAt = session.pausedAt ? new Date(session.pausedAt) : new Date();
    const now = new Date();
    const pausedMs = now - pausedAt;
    const pausedMinutes = Math.floor(pausedMs / (1000 * 60));
    
    session.isPaused = false;
    session.pausedAt = null;
    session.pausedDuration = (session.pausedDuration || 0) + pausedMinutes;
    await session.save();
    
    console.log(`▶️ Session ${id} resumed after ${pausedMinutes} minutes`);
    
    res.json({ success: true, message: 'Session resumed', session });
  } catch (error) {
    console.error('❌ Error resuming session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End study session manually
exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { focusLevel, completionNotes, completedTopics } = req.body;
    
    const session = await StudySessionSchedule.findOne({ _id: id, userId })
      .populate('subjectId', 'subjectName color');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (!session.actualStartTime) {
      return res.status(400).json({ message: 'Session has not started yet' });
    }
    
    // Tính thời gian học thực tế từ startTime (không phải từ actualStartTime)
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const plannedStartTime = new Date(session.date);
    plannedStartTime.setHours(startHour, startMinute, 0, 0);
    
    const now = new Date();
    const pausedDuration = session.pausedDuration || 0;
    
    // Nếu đang pause, cộng thêm thời gian pause hiện tại
    let totalPausedMinutes = pausedDuration;
    if (session.isPaused && session.pausedAt) {
      const currentPausedMs = now - new Date(session.pausedAt);
      totalPausedMinutes += Math.floor(currentPausedMs / (1000 * 60));
    }
    
    // Tính duration từ startTime (không phải actualStartTime)
    const totalMs = now - plannedStartTime;
    const actualDuration = Math.max(0, Math.floor(totalMs / (1000 * 60)) - totalPausedMinutes);
    
    // Cập nhật session
    session.actualEndTime = now;
    session.actualDuration = actualDuration;
    session.status = 'completed';
    session.isPaused = false;
    session.pausedAt = null;
    session.focusLevel = focusLevel || 3;
    session.completionNotes = completionNotes || '';
    session.completedTopics = completedTopics || [];
    
    await session.save();
    
    console.log(`✅ Session ${id} completed. Duration: ${actualDuration} minutes`);
    
    // Gửi email chúc mừng (nếu có emailService)
    try {
      const { sendCompletionEmail } = require('../services/emailService');
      const user = await require('../models/User').findById(userId);
      
      if (user && user.email && sendCompletionEmail) {
        await sendCompletionEmail(user.email, {
          userName: user.name,
          subjectName: session.subjectId?.subjectName || 'Study Session',
          actualDuration,
          startTime: session.startTime,
          endTime: session.endTime,
          focusLevel
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending completion email:', emailError);
      // Không throw error, chỉ log
    }
    
    res.json({ 
      success: true, 
      message: 'Session completed', 
      session,
      stats: {
        actualDuration,
        pausedDuration: totalPausedMinutes,
        focusLevel
      }
    });
  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weekly schedule
exports.getWeeklySchedule = async (req, res) => {
  try {
    const { offset } = req.query;
    const userId = req.user._id;
    const weekOffset = parseInt(offset) || 0;

    console.log('📅 Fetching weekly schedule for user:', userId, 'Offset:', weekOffset);

    // Calculate week date range based on current week + offset
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Get current Monday
    const currentMonday = new Date(today);
    const daysToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    currentMonday.setDate(today.getDate() + daysToMonday);
    currentMonday.setHours(0, 0, 0, 0);
    
    // Calculate current week number
    const startOfYear = new Date(currentMonday.getFullYear(), 0, 1);
    const daysSinceStartOfYear = Math.floor((currentMonday - startOfYear) / (24 * 60 * 60 * 1000));
    const currentWeekNumber = Math.ceil((daysSinceStartOfYear + 1) / 7);
    
    // Apply offset to get requested week
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Monday to Sunday (7 days total)
    weekEnd.setHours(23, 59, 59, 999);

    const weekNumber = currentWeekNumber + weekOffset;

    console.log('📅 Current week:', currentWeekNumber, '| Requested week:', weekNumber);
    console.log('📅 Week range:', weekStart.toDateString(), '-', weekEnd.toDateString());

    // Find sessions in this week
    const sessions = await StudySessionSchedule.find({
      userId,
      date: {
        $gte: weekStart,
        $lte: weekEnd
      }
    })
    .populate('subjectId', 'subjectName color subjectCode')
    .sort({ date: 1, startTime: 1 })
    .lean();

    // Map sessions to include day of week and time slot
    const mappedSessions = sessions.map(session => {
      const sessionDate = new Date(session.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[sessionDate.getDay()];
      
      // Determine time slot based on start time
      let timeSlot = 'Mor';
      if (session.startTime) {
        const hour = parseInt(session.startTime.split(':')[0]);
        if (hour >= 12 && hour < 17) {
          timeSlot = 'Aft';
        } else if (hour >= 17) {
          timeSlot = 'Eve';
        }
      }

      return {
        ...session,
        dayOfWeek,
        timeSlot,
        subjectInfo: session.subjectId
      };
    });

    console.log(`✅ Found ${mappedSessions.length} sessions for week ${weekNumber}`);

    res.json({
      weekNumber,
      sessions: mappedSessions
    });
  } catch (error) {
    console.error('❌ Error fetching weekly schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sessions by date range (for monthly view)
exports.getSessionsByRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.user._id;

    console.log('📅 Fetching sessions by range for user:', userId);
    console.log('📅 Date range:', { start, end });

    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    // Find sessions in this date range
    const sessions = await StudySessionSchedule.find({
      userId,
      date: {
        $gte: rangeStart,
        $lte: rangeEnd
      }
    })
    .populate('subjectId', 'subjectName color subjectCode')
    .sort({ date: 1, startTime: 1 })
    .lean();

    // Map sessions to include day of week and time slot
    const mappedSessions = sessions.map(session => {
      const sessionDate = new Date(session.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[sessionDate.getDay()];
      
      // Determine time slot based on start time
      let timeSlot = 'Mor';
      if (session.startTime) {
        const hour = parseInt(session.startTime.split(':')[0]);
        if (hour >= 12 && hour < 17) {
          timeSlot = 'Aft';
        } else if (hour >= 17) {
          timeSlot = 'Eve';
        }
      }

      return {
        ...session,
        dayOfWeek,
        timeSlot,
        subjectInfo: session.subjectId
      };
    });

    console.log(`✅ Found ${mappedSessions.length} sessions in date range`);

    res.json(mappedSessions);
  } catch (error) {
    console.error('❌ Error fetching sessions by range:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
