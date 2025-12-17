const MoodTracking = require('../models/MoodTracking');
const Gamification = require('../models/Gamification');
const Streak = require('../models/Streak');
const AIMoodInsight = require('../models/AIMoodInsight');

// @desc    Create mood tracking entry (Daily Check-in)
// @route   POST /api/moods
// @access  Private
exports.createMoodEntry = async (req, res) => {
  try {
    const { mood, emotionTags, note, energyLevel } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tâm trạng (1-5)'
      });
    }

    // Check if mood entry already exists for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingMood = await MoodTracking.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingMood) {
      // Update existing mood entry
      existingMood.mood = mood;
      existingMood.emotionTags = emotionTags || [];
      existingMood.note = note || '';
      existingMood.energyLevel = energyLevel || 5;
      await existingMood.save();

      return res.status(200).json({
        success: true,
        message: 'Đã cập nhật cảm xúc hôm nay 💙',
        data: existingMood
      });
    }

    // Create new mood entry
    const moodEntry = await MoodTracking.create({
      userId,
      mood,
      emotionTags: emotionTags || [],
      note: note || '',
      energyLevel: energyLevel || 5,
      date: new Date()
    });

    // Update Gamification: Add XP for mood check-in
    let gamification = await Gamification.findOne({ userId });
    if (!gamification) {
      gamification = await Gamification.create({ userId });
    }
    
    gamification.addXP(10, 'Mood check-in hôm nay');
    await gamification.save();

    // Update Streak
    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = await Streak.create({ userId });
    }
    
    streak.updateStreak();
    await streak.save();

    // Check for "Self-aware Learner" badge (7 consecutive days)
    if (streak.currentStreak >= 7) {
      const hasBadge = gamification.badges.some(b => b.name === 'Self-aware Learner');
      if (!hasBadge) {
        gamification.badges.push({
          name: 'Self-aware Learner',
          description: 'Check-in cảm xúc 7 ngày liên tiếp',
          earnedAt: new Date()
        });
        gamification.addXP(50, 'Earned "Self-aware Learner" badge');
        await gamification.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đã lưu cảm xúc hôm nay 💙',
      data: {
        mood: moodEntry,
        xpGained: 10,
        currentStreak: streak.currentStreak,
        newBadge: streak.currentStreak === 7 ? 'Self-aware Learner' : null
      }
    });

  } catch (error) {
    console.error('Create mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu cảm xúc',
      error: error.message
    });
  }
};

// @desc    Get mood entries with optional date range
// @route   GET /api/moods
// @access  Private
exports.getMoodEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { userId };

    // Apply date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const moods = await MoodTracking.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('aiInsight');

    res.status(200).json({
      success: true,
      count: moods.length,
      data: moods
    });

  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu cảm xúc',
      error: error.message
    });
  }
};

// @desc    Get today's mood entry
// @route   GET /api/moods/today
// @access  Private
exports.getTodayMood = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayMood = await MoodTracking.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('aiInsight');

    res.status(200).json({
      success: true,
      data: todayMood
    });

  } catch (error) {
    console.error('Get today mood error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cảm xúc hôm nay',
      error: error.message
    });
  }
};

// @desc    Get mood by specific date
// @route   GET /api/moods/date/:date
// @access  Private
exports.getMoodByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.params;

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const moodEntry = await MoodTracking.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('aiInsight');

    if (!moodEntry) {
      return res.status(404).json({
        success: false,
        message: 'Không có dữ liệu cảm xúc cho ngày này'
      });
    }

    res.status(200).json({
      success: true,
      data: moodEntry
    });

  } catch (error) {
    console.error('Get mood by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cảm xúc',
      error: error.message
    });
  }
};

// @desc    Get mood statistics
// @route   GET /api/moods/stats
// @access  Private
exports.getMoodStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moods = await MoodTracking.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Calculate statistics
    const totalEntries = moods.length;
    const avgMood = totalEntries > 0 
      ? (moods.reduce((sum, m) => sum + m.mood, 0) / totalEntries).toFixed(2)
      : 0;
    
    const avgEnergy = totalEntries > 0
      ? (moods.reduce((sum, m) => sum + (m.energyLevel || 5), 0) / totalEntries).toFixed(2)
      : 0;

    // Mood distribution
    const moodDistribution = {
      1: moods.filter(m => m.mood === 1).length,
      2: moods.filter(m => m.mood === 2).length,
      3: moods.filter(m => m.mood === 3).length,
      4: moods.filter(m => m.mood === 4).length,
      5: moods.filter(m => m.mood === 5).length,
    };

    // Most common emotions
    const emotionCount = {};
    moods.forEach(m => {
      m.emotionTags.forEach(tag => {
        emotionCount[tag] = (emotionCount[tag] || 0) + 1;
      });
    });
    
    const topEmotions = Object.entries(emotionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        avgMood: parseFloat(avgMood),
        avgEnergy: parseFloat(avgEnergy),
        moodDistribution,
        topEmotions,
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('Get mood stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê cảm xúc',
      error: error.message
    });
  }
};

// @desc    Delete mood entry
// @route   DELETE /api/moods/:id
// @access  Private
exports.deleteMoodEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const moodEntry = await MoodTracking.findOne({ _id: id, userId });

    if (!moodEntry) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu cảm xúc'
      });
    }

    await moodEntry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa dữ liệu cảm xúc'
    });

  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa cảm xúc',
      error: error.message
    });
  }
};

// @desc    Generate AI mood insight
// @route   POST /api/moods/:id/insight
// @access  Private
exports.generateMoodInsight = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const moodEntry = await MoodTracking.findOne({ _id: id, userId });

    if (!moodEntry) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu cảm xúc'
      });
    }

    // Get recent mood entries for pattern analysis
    const recentMoods = await MoodTracking.find({ userId })
      .sort({ date: -1 })
      .limit(7);

    // Simple AI insight generation (can be enhanced with real AI later)
    const avgRecentMood = recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length;
    
    let insightText = '';
    let behaviorPattern = '';
    let recommendations = [];
    let confidenceScore = 0.7;

    if (avgRecentMood >= 4) {
      insightText = 'Tâm trạng của bạn trong thời gian gần đây rất tích cực! Hãy tiếp tục duy trì lối sống lành mạnh.';
      behaviorPattern = 'Positive trend';
      recommendations = [
        'Tiếp tục duy trì thói quen học tập hiện tại',
        'Chia sẻ năng lượng tích cực với bạn bè',
        'Đặt mục tiêu mới để thử thách bản thân'
      ];
    } else if (avgRecentMood >= 3) {
      insightText = 'Tâm trạng của bạn khá ổn định. Hãy chú ý đến sức khỏe tinh thần của mình.';
      behaviorPattern = 'Stable mood';
      recommendations = [
        'Dành thời gian thư giãn mỗi ngày',
        'Tập thể dục nhẹ nhàng',
        'Kết nối với người thân yêu'
      ];
    } else {
      insightText = 'Có vẻ như bạn đang gặp một số khó khăn. Đừng ngần ngại tìm kiếm sự hỗ trợ.';
      behaviorPattern = 'Needs attention';
      recommendations = [
        'Nói chuyện với người bạn tin tưởng',
        'Nghỉ ngơi và chăm sóc bản thân',
        'Xem xét giảm bớt áp lực học tập',
        'Tìm kiếm sự hỗ trợ chuyên nghiệp nếu cần'
      ];
    }

    // Create or update AI insight
    const insight = await AIMoodInsight.findOneAndUpdate(
      { moodId: id },
      {
        userId,
        moodId: id,
        insightText,
        behaviorPattern,
        recommendations,
        confidenceScore,
        generatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Đã tạo phân tích cảm xúc',
      data: insight
    });

  } catch (error) {
    console.error('Generate mood insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phân tích cảm xúc',
      error: error.message
    });
  }
};
