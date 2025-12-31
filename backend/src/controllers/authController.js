const User = require('../models/User');
const Streak = require('../models/Streak');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Access token valid for 7 days
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d', // Refresh token valid for 30 days
  });
};

// Configure email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Helper function to get Vietnam time (UTC+7)
// Note: Server runs with TZ=Asia/Ho_Chi_Minh, so new Date() is already Vietnam time
const getVietnamDate = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

// Update user streak on login
const updateUserStreak = async (userId) => {
  try {
    const today = getVietnamDate();
    
    // Find or create streak record for user
    let streak = await Streak.findOne({ userId });
    
    if (!streak) {
      // Create new streak record
      streak = await Streak.create({
        userId,
        lastActiveDate: today,
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        streakHistory: [{ date: today, activityCount: 1 }]
      });
      
      console.log(`🔥 New streak created for user ${userId}: 1 day`);
      return streak;
    }
    
    // Get last active date normalized to start of day
    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Streak check - Today: ${today.toDateString()}, Last Active: ${lastActive.toDateString()}, Days Diff: ${daysDiff}`);
    
    if (daysDiff === 0) {
      // Same day - already checked in today, don't update streak
      console.log(`✅ Already checked in today. Current streak: ${streak.currentStreak}`);
      return streak;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      streak.currentStreak += 1;
      streak.totalActiveDays += 1;
      
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
      
      // Add today to streak history
      streak.streakHistory.push({ date: today, activityCount: 1 });
      
      console.log(`🔥 Streak continued! New streak: ${streak.currentStreak} days`);
    } else {
      // Streak broken (more than 1 day gap) - reset to 1
      streak.currentStreak = 1;
      streak.totalActiveDays += 1;
      
      // Add today to streak history
      streak.streakHistory.push({ date: today, activityCount: 1 });
      
      console.log(`💔 Streak broken! Reset to 1 day`);
    }
    
    // Update last active date
    streak.lastActiveDate = today;
    await streak.save();
    
    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    // Return a default streak object if error
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, streakHistory: [] };
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Email này đã được đăng ký' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Create user with default streakCount = 1
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      streakCount: 1,
    });

    if (user) {
      // Create initial streak record for new user
      const streakData = await updateUserStreak(user._id);
      
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          streakCount: streakData.currentStreak,
          token,
          refreshToken,
        },
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ khi đăng ký' 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập email và mật khẩu' 
      });
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Tài khoản tạm thời bị khóa do nhiều lần đăng nhập sai. Vui lòng thử lại sau.' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ 
        success: false,
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update streak on login
    const streakData = await updateUserStreak(user._id);
    user.streakCount = streakData.currentStreak;
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        premiumStatus: user.premiumStatus,
        level: user.level,
        xp: user.xp,
        streakCount: streakData.currentStreak,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ khi đăng nhập' 
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy tài khoản với email này' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save reset token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content in Vietnamese
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d946ef 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #d946ef 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 S'techdy</h1>
          </div>
          <div class="content">
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản S'techdy của mình.</p>
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
            <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>© 2025 S'techdy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const transporter = createTransporter();
      
      // Check if email is configured
      if (!transporter) {
        // In development, log the reset URL
        console.log('\n=== LINK ĐẶT LẠI MẬT KHẨU ===');
        console.log(`Email: ${user.email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`Token: ${resetToken}`);
        console.log('==============================\n');
        
        return res.status(200).json({ 
          success: true,
          message: 'Link đặt lại mật khẩu đã được tạo (Email chưa cấu hình - xem console để lấy link)',
          resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
        });
      }

      // Send email
      await transporter.sendMail({
        from: `"S'techdy Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Đặt lại mật khẩu - S\'techdy',
        html: message,
      });

      console.log(`Email đặt lại mật khẩu đã được gửi đến: ${user.email}`);

      res.status(200).json({ 
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.' 
      });
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Log for debugging
      console.log('\n=== THÔNG TIN DEBUG EMAIL ===');
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET');
      console.log('Error:', error.message);
      console.log('=============================\n');

      return res.status(500).json({ 
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ' 
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập mật khẩu mới' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Hash token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' 
      });
    }

    // Set new password
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ' 
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        premiumStatus: user.premiumStatus,
        level: user.level,
        xp: user.xp,
        streakCount: user.streakCount,
        isVerified: user.isVerified,
        joinedAt: user.joinedAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ' 
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({ 
      success: true,
      message: 'Đăng xuất thành công' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ' 
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');

    // Check current password
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Mật khẩu hiện tại không đúng' 
      });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Đổi mật khẩu thành công' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi máy chủ' 
    });
  }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        success: false,
        message: 'Thiếu credential từ Google' 
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by googleId or email
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
      }
      user.lastLogin = Date.now();
      user.isVerified = true; // Google accounts are verified
      await user.save();
    } else {
      // Create new user with Google info
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        avatarUrl: picture || null,
        isVerified: true,
        lastLogin: Date.now(),
        streakCount: 1, // Default streak for new users
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update streak on Google login
    const streakData = await updateUserStreak(user._id);
    user.streakCount = streakData.currentStreak;
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        premiumStatus: user.premiumStatus,
        authProvider: user.authProvider,
        streakCount: streakData.currentStreak,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Lỗi khi đăng nhập bằng Google' 
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không được cung cấp'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken 
    }).select('+refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token đã được làm mới',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi làm mới token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear refresh token from database
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đăng xuất'
    });
  }
};

