const Deadline = require('../models/Deadline');
const Subject = require('../models/Subject');

// @desc    Get all deadlines for current user
// @route   GET /api/deadlines
// @access  Private
exports.getDeadlines = async (req, res) => {
  try {
    const userId = req.user._id;

    const deadlines = await Deadline.find({ userId })
      .populate('subjectId', 'subjectName color')
      .sort({ dueDate: 1 })
      .lean();

    res.json(deadlines);
  } catch (error) {
    console.error('❌ Error fetching deadlines:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get deadlines by subject
// @route   GET /api/deadlines/subject/:subjectId
// @access  Private
exports.getDeadlinesBySubject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectId } = req.params;

    console.log('📅 Fetching deadlines for subject:', subjectId);

    const deadlines = await Deadline.find({ userId, subjectId })
      .populate('subjectId', 'subjectName color')
      .sort({ dueDate: 1 })
      .lean();

    console.log(`✅ Found ${deadlines.length} deadlines for subject`);

    res.json(deadlines);
  } catch (error) {
    console.error('❌ Error fetching deadlines by subject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get upcoming deadlines (not completed, not overdue)
// @route   GET /api/deadlines/upcoming
// @access  Private
exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const deadlines = await Deadline.find({
      userId,
      isCompleted: false,
      dueDate: { $gte: now }
    })
      .populate('subjectId', 'subjectName color')
      .sort({ dueDate: 1 })
      .limit(10)
      .lean();

    res.json(deadlines);
  } catch (error) {
    console.error('❌ Error fetching upcoming deadlines:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single deadline
// @route   GET /api/deadlines/:id
// @access  Private
exports.getDeadline = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deadline = await Deadline.findOne({ _id: id, userId })
      .populate('subjectId', 'subjectName color');

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    res.json(deadline);
  } catch (error) {
    console.error('❌ Error fetching deadline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new deadline
// @route   POST /api/deadlines
// @access  Private
exports.createDeadline = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjectId, title, description, dueDate, dueTime, deadlineType, priorityLevel } = req.body;

    // Validate required fields
    if (!subjectId || !title || !dueDate || !deadlineType) {
      return res.status(400).json({ 
        message: 'Missing required fields: subjectId, title, dueDate, deadlineType' 
      });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const deadline = await Deadline.create({
      userId,
      subjectId,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      dueTime: dueTime || '23:59',
      deadlineType,
      priorityLevel: priorityLevel || 'medium',
      status: 'pending'
    });

    const populatedDeadline = await Deadline.findById(deadline._id)
      .populate('subjectId', 'subjectName color');

    console.log('✅ Created deadline:', deadline.title);

    res.status(201).json(populatedDeadline);
  } catch (error) {
    console.error('❌ Error creating deadline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a deadline
// @route   PUT /api/deadlines/:id
// @access  Private
exports.updateDeadline = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;

    const deadline = await Deadline.findOne({ _id: id, userId });

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        deadline[key] = updates[key];
      }
    });

    await deadline.save();

    const populatedDeadline = await Deadline.findById(id)
      .populate('subjectId', 'subjectName color');

    res.json(populatedDeadline);
  } catch (error) {
    console.error('❌ Error updating deadline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Complete a deadline
// @route   POST /api/deadlines/:id/complete
// @access  Private
exports.completeDeadline = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { grade, score } = req.body;

    const deadline = await Deadline.findOne({ _id: id, userId });

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    deadline.isCompleted = true;
    deadline.completedAt = new Date();
    deadline.status = 'completed';
    
    if (grade) deadline.grade = grade;
    if (score !== undefined) deadline.score = score;

    await deadline.save();

    const populatedDeadline = await Deadline.findById(id)
      .populate('subjectId', 'subjectName color');

    console.log('✅ Completed deadline:', deadline.title);

    res.json(populatedDeadline);
  } catch (error) {
    console.error('❌ Error completing deadline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a deadline
// @route   DELETE /api/deadlines/:id
// @access  Private
exports.deleteDeadline = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deadline = await Deadline.findOneAndDelete({ _id: id, userId });

    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not found' });
    }

    console.log('✅ Deleted deadline:', deadline.title);

    res.json({ message: 'Deadline deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting deadline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
