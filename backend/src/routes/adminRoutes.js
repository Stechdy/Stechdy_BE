const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// All admin routes require authentication
router.use(protect);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId', adminController.updateUser);
router.put('/users/:userId/status', adminController.toggleUserStatus);
router.put('/users/:userId/role', adminController.changeUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// Revenue & Reports
router.get('/revenue/stats', adminController.getRevenueStats);
router.get('/reports/monthly', adminController.getMonthlyReport);

// System
router.post('/notifications/broadcast', adminController.sendBroadcastNotification);
router.get('/activity-logs', adminController.getActivityLogs);

module.exports = router;
