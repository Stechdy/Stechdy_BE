const User = require('../models/User');
const Streak = require('../models/Streak');
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
        premiumExpiryDate: user.premiumExpiryDate,
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

// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          premiumStatus: user.premiumStatus,
          premiumExpiryDate: user.premiumExpiryDate,
          streakCount: user.streakCount,
          level: user.level,
          xp: user.xp,
          timezone: user.timezone,
          joinedAt: user.joinedAt
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // Get streak data from Streak model
    const streak = await Streak.findOne({ userId: req.user._id });

    // Calculate total study hours from completed sessions
    const completedSessions = await StudySessionSchedule.find({
      userId: req.user._id,
      status: 'completed'
    });

    const totalMinutes = completedSessions.reduce((sum, session) => {
      return sum + (session.actualDuration || session.plannedDuration || 90);
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    // Get streak history - days user has logged in
    let streakDays = [];
    if (streak && streak.streakHistory) {
      streakDays = streak.streakHistory.map(item => {
        const date = new Date(item.date);
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          fullDate: date.toISOString().split('T')[0]
        };
      });
    }

    // Get calendar data - combine streak history and completed sessions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get all days this month with login activity
    const loginDaysThisMonth = streakDays
      .filter(d => d.month === currentMonth + 1 && d.year === currentYear)
      .map(d => d.day);

    // Get all days this month with completed sessions
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const sessionsThisMonth = await StudySessionSchedule.find({
      userId: req.user._id,
      date: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      },
      status: 'completed'
    });

    const sessionDaysThisMonth = [...new Set(
      sessionsThisMonth.map(session => new Date(session.date).getDate())
    )];

    // Combine login days and session days (unique)
    const activeDays = [...new Set([...loginDaysThisMonth, ...sessionDaysThisMonth])].sort((a, b) => a - b);

    console.log(`✅ Streak: ${streak?.currentStreak || user.streakCount} days, Total hours: ${totalHours}h, Active days: ${activeDays.length}`);

    res.json({
      currentStreak: streak?.currentStreak || user.streakCount || 0,
      longestStreak: streak?.longestStreak || 0,
      totalActiveDays: streak?.totalActiveDays || 0,
      totalHours,
      calendar: activeDays,
      streakHistory: streakDays,
      lastActiveDate: streak?.lastActiveDate || null
    });
  } catch (error) {
    console.error('❌ Error fetching streak data:', error);
    res.status(500).json({ message: error.message });
  }
};
