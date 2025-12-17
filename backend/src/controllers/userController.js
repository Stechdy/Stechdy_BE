const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    console.log('👤 Fetching profile for user:', req.user._id);
    const user = await User.findById(req.user._id).select('-passwordHash');

    if (user) {
      console.log('✅ User found:', user.name, 'Streak:', user.streakCount);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        level: user.level,
        xp: user.xp,
        streakCount: user.streakCount,
        premiumStatus: user.premiumStatus,
        bio: user.bio,
        phone: user.phone,
        timezone: user.timezone,
        notificationSettings: user.notificationSettings,
        settings: user.settings,
        joinedAt: user.joinedAt,
        lastLogin: user.lastLogin
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user streak data
// @route   GET /api/users/streak
// @access  Private
exports.getUserStreak = async (req, res) => {
  try {
    console.log('🔥 Fetching streak data for user:', req.user._id);
    
    const user = await User.findById(req.user._id);
    const StudySessionSchedule = require('../models/StudySessionSchedule');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total study hours from completed sessions
    const completedSessions = await StudySessionSchedule.find({
      userId: req.user._id,
      status: 'completed'
    });

    const totalMinutes = completedSessions.reduce((sum, session) => {
      return sum + (session.actualDuration || session.plannedDuration || 90);
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    // Get calendar data (days with study sessions in current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const sessionsThisMonth = await StudySessionSchedule.find({
      userId: req.user._id,
      date: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      },
      status: 'completed'
    });

    // Extract unique days that have sessions
    const activeDays = [...new Set(
      sessionsThisMonth.map(session => new Date(session.date).getDate())
    )];

    console.log(`✅ Streak: ${user.streakCount} days, Total hours: ${totalHours}h, Active days: ${activeDays.length}`);

    res.json({
      currentStreak: user.streakCount || 0,
      totalHours,
      calendar: activeDays.sort((a, b) => a - b)
    });
  } catch (error) {
    console.error('❌ Error fetching streak data:', error);
    res.status(500).json({ message: error.message });
  }
};
