const User = require('../models/User');
const Payment = require('../models/Payment');
const StudySessionSchedule = require('../models/StudySessionSchedule');
const Subject = require('../models/Subject');
const MoodTracking = require('../models/MoodTracking');
const Deadline = require('../models/Deadline');
const mongoose = require('mongoose');

// Middleware to check admin role
const isAdmin = (user) => {
  return user && (user.role === 'admin' || user.role === 'moderator');
};

// =====================
// DASHBOARD STATISTICS
// =====================

// Get dashboard overview statistics
exports.getDashboardStats = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // User Statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const premiumUsers = await User.countDocuments({ role: 'user', premiumStatus: 'premium' });
    const activeUsers = await User.countDocuments({ 
      role: 'user', 
      isActive: true,
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
    });
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });
    const newUsersLastMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    // Payment Statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'verified', verifiedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const lastMonthRevenue = await Payment.aggregate([
      { $match: { status: 'verified', verifiedAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    // Study Sessions Statistics
    const totalStudySessions = await StudySessionSchedule.countDocuments();
    const completedSessions = await StudySessionSchedule.countDocuments({ status: 'completed' });
    const totalStudyMinutes = await StudySessionSchedule.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualDuration' } } }
    ]);

    // Recent Activity
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatarUrl createdAt premiumStatus');

    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('userName userEmail amount status createdAt planName');

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          newLastMonth: newUsersLastMonth,
          growthRate: newUsersLastMonth > 0 
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : 100
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: monthlyRevenue[0]?.total || 0,
          lastMonth: lastMonthRevenue[0]?.total || 0,
          pendingPayments,
          growthRate: lastMonthRevenue[0]?.total > 0
            ? (((monthlyRevenue[0]?.total || 0) - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total * 100).toFixed(1)
            : 100
        },
        studySessions: {
          total: totalStudySessions,
          completed: completedSessions,
          completionRate: totalStudySessions > 0 
            ? ((completedSessions / totalStudySessions) * 100).toFixed(1)
            : 0,
          totalStudyHours: Math.round((totalStudyMinutes[0]?.total || 0) / 60)
        },
        recentUsers,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================
// USER MANAGEMENT
// =====================

// Get all users with pagination and filtering
exports.getAllUsers = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    }
    
    if (req.query.premiumStatus && req.query.premiumStatus !== 'all') {
      filter.premiumStatus = req.query.premiumStatus;
    }
    
    if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Sort
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-passwordHash');

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user details with full information
exports.getUserDetails = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's study sessions
    const studySessions = await StudySessionSchedule.find({ userId })
      .sort({ date: -1 })
      .limit(20)
      .populate('subjectId', 'name color');

    // Get user's payments
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's subjects
    const subjects = await Subject.find({ userId });

    // Get user's mood tracking
    const moodEntries = await MoodTracking.find({ userId })
      .sort({ date: -1 })
      .limit(30);

    // Get user's deadlines
    const deadlines = await Deadline.find({ userId })
      .sort({ dueDate: 1 })
      .limit(10);

    // Calculate statistics
    const totalStudyMinutes = await StudySessionSchedule.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualDuration' } } }
    ]);

    const completedSessions = await StudySessionSchedule.countDocuments({ 
      userId, 
      status: 'completed' 
    });

    const totalPayments = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        user,
        studySessions,
        payments,
        subjects,
        moodEntries,
        deadlines,
        statistics: {
          totalStudyHours: Math.round((totalStudyMinutes[0]?.total || 0) / 60),
          completedSessions,
          totalSubjects: subjects.length,
          totalPayments: totalPayments[0]?.total || 0,
          avgMoodScore: moodEntries.length > 0
            ? (moodEntries.reduce((sum, m) => sum + (m.moodScore || 0), 0) / moodEntries.length).toFixed(1)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (admin)
exports.updateUser = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.passwordHash;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ban/Unban user
exports.toggleUserStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: isActive ? 'User activated' : 'User deactivated',
      data: user
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    // Only admin can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User role changed to ${role}`,
      data: user
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      StudySessionSchedule.deleteMany({ userId }),
      Subject.deleteMany({ userId }),
      MoodTracking.deleteMany({ userId }),
      Deadline.deleteMany({ userId }),
      // Keep payment records for accounting
    ]);

    res.json({
      success: true,
      message: 'User and related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================
// REVENUE & REPORTS
// =====================

// Get revenue statistics
exports.getRevenueStats = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy, dateFormat;
    
    if (period === 'daily') {
      groupBy = { 
        year: { $year: '$verifiedAt' },
        month: { $month: '$verifiedAt' },
        day: { $dayOfMonth: '$verifiedAt' }
      };
      dateFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$verifiedAt' },
        week: { $week: '$verifiedAt' }
      };
      dateFormat = '%Y-W%V';
    } else {
      groupBy = {
        year: { $year: '$verifiedAt' },
        month: { $month: '$verifiedAt' }
      };
      dateFormat = '%Y-%m';
    }

    const revenueByPeriod = await Payment.aggregate([
      { 
        $match: { 
          status: 'verified',
          verifiedAt: { 
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        } 
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      { 
        $match: { 
          status: 'verified',
          verifiedAt: { 
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        } 
      },
      {
        $group: {
          _id: '$planId',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
          planName: { $first: '$planName' }
        }
      }
    ]);

    // Summary
    const totalRevenue = revenueByPeriod.reduce((sum, p) => sum + p.revenue, 0);
    const totalTransactions = revenueByPeriod.reduce((sum, p) => sum + p.count, 0);

    res.json({
      success: true,
      data: {
        period,
        year: parseInt(year),
        revenueByPeriod,
        revenueByPlan,
        summary: {
          totalRevenue,
          totalTransactions,
          avgTransaction: totalTransactions > 0 
            ? Math.round(totalRevenue / totalTransactions)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get monthly report
exports.getMonthlyReport = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { month, year } = req.query;
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const previousMonthStart = new Date(targetYear, targetMonth - 2, 1);
    const previousMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59);

    // User metrics
    const newUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const previousNewUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    const premiumConversions = await User.countDocuments({
      role: 'user',
      premiumStatus: 'premium',
      premiumExpiryDate: { $gte: startDate }
    });

    // Revenue metrics
    const revenue = await Payment.aggregate([
      { $match: { status: 'verified', verifiedAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const previousRevenue = await Payment.aggregate([
      { $match: { status: 'verified', verifiedAt: { $gte: previousMonthStart, $lte: previousMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Study metrics
    const studySessions = await StudySessionSchedule.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalMinutes: { $sum: '$actualDuration' }
        }
      }
    ]);

    // Top active users
    const topUsers = await StudySessionSchedule.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, status: 'completed' } },
      {
        $group: {
          _id: '$userId',
          totalMinutes: { $sum: '$actualDuration' },
          sessionsCompleted: { $sum: 1 }
        }
      },
      { $sort: { totalMinutes: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalMinutes: 1,
          sessionsCompleted: 1,
          'user.name': 1,
          'user.email': 1,
          'user.avatarUrl': 1
        }
      }
    ]);

    // Payment breakdown
    const paymentsByPlan = await Payment.aggregate([
      { $match: { status: 'verified', verifiedAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$planId',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
          planName: { $first: '$planName' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString('vi-VN', { month: 'long' })
        },
        users: {
          newUsers,
          previousNewUsers,
          growthRate: previousNewUsers > 0 
            ? ((newUsers - previousNewUsers) / previousNewUsers * 100).toFixed(1)
            : 100,
          premiumConversions
        },
        revenue: {
          total: revenue[0]?.total || 0,
          transactions: revenue[0]?.count || 0,
          previous: previousRevenue[0]?.total || 0,
          growthRate: previousRevenue[0]?.total > 0
            ? (((revenue[0]?.total || 0) - previousRevenue[0]?.total) / previousRevenue[0]?.total * 100).toFixed(1)
            : 100,
          byPlan: paymentsByPlan
        },
        studySessions: {
          total: studySessions[0]?.total || 0,
          completed: studySessions[0]?.completed || 0,
          completionRate: studySessions[0]?.total > 0
            ? ((studySessions[0]?.completed / studySessions[0]?.total) * 100).toFixed(1)
            : 0,
          totalHours: Math.round((studySessions[0]?.totalMinutes || 0) / 60)
        },
        topUsers
      }
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================
// SYSTEM NOTIFICATIONS
// =====================

// Send notification to all users
exports.sendBroadcastNotification = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, message, targetUsers = 'all' } = req.body;

    let filter = { role: 'user' };
    if (targetUsers === 'premium') {
      filter.premiumStatus = 'premium';
    } else if (targetUsers === 'free') {
      filter.premiumStatus = 'free';
    }

    const users = await User.find(filter).select('_id');
    const userIds = users.map(u => u._id);

    // Create notifications (assuming Notification model exists)
    const Notification = require('../models/Notification');
    const notifications = userIds.map(userId => ({
      userId,
      type: 'system',
      title,
      message,
      data: { from: 'admin', broadcastId: new mongoose.Types.ObjectId() }
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      count: userIds.length
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================
// ACTIVITY LOGS
// =====================

// Get recent activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get recent user registrations
    const recentRegistrations = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt');

    // Get recent payments
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userName userEmail amount status createdAt planName');

    // Get recent logins
    const recentLogins = await User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email lastLogin');

    // Combine and format
    const activities = [
      ...recentRegistrations.map(u => ({
        type: 'registration',
        user: u.name,
        email: u.email,
        description: 'New user registered',
        timestamp: u.createdAt
      })),
      ...recentPayments.map(p => ({
        type: 'payment',
        user: p.userName,
        email: p.userEmail,
        description: `${p.planName} - ${p.status}`,
        amount: p.amount,
        timestamp: p.createdAt
      })),
      ...recentLogins.map(u => ({
        type: 'login',
        user: u.name,
        email: u.email,
        description: 'User logged in',
        timestamp: u.lastLogin
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
