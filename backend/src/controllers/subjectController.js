const Semester = require('../models/Semester');
const Subject = require('../models/Subject');

// @desc    Get all subjects for current user's active semester
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    console.log('📚 Fetching subjects for user:', req.user._id);

    // Find active semester for the user
    const activeSemester = await Semester.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!activeSemester) {
      console.log('⚠️ No active semester found');
      return res.json([]);
    }

    console.log('✅ Found active semester:', activeSemester.semesterName);

    // Get all subjects in this semester
    const subjects = await Subject.find({
      semesterId: activeSemester._id
    }).select('subjectName color credits instructor schedule');

    console.log(`✅ Found ${subjects.length} subjects`);

    res.json(subjects);
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error fetching subjects' });
  }
};

// @desc    Get a single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📚 Fetching subject by ID:', id);

    const subject = await Subject.findById(id)
      .select('subjectName color credits instructor schedule semesterId');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    console.log('✅ Found subject:', subject.subjectName);

    res.json(subject);
  } catch (error) {
    console.error('❌ Error fetching subject:', error);
    res.status(500).json({ message: 'Server error fetching subject' });
  }
};

module.exports = {
  getSubjects,
  getSubjectById
};
