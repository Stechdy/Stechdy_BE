const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserStreak,
  getCurrentUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/streak', protect, getUserStreak);

module.exports = router;
