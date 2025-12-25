const MoodTracking = require('../models/MoodTracking');

/**
 * Service to analyze user's mood patterns and provide insights
 * Used for personalizing notifications and messages
 */

/**
 * Get user's mood trend for the last N days
 * @param {ObjectId} userId - User ID
 * @param {Number} days - Number of days to analyze (default: 7)
 * @returns {Object} Mood analysis results
 */
const analyzeMoodTrend = async (userId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const moodEntries = await MoodTracking.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    if (moodEntries.length === 0) {
      return {
        trend: 'neutral',
        avgMoodLevel: 3,
        consistency: 'low',
        hasData: false,
        recentMood: null,
        totalEntries: 0
      };
    }

    // Calculate average mood level (1-5 scale)
    const moodLevelMap = {
      'very_sad': 1,
      'sad': 2,
      'neutral': 3,
      'happy': 4,
      'very_happy': 5
    };

    const avgMoodLevel = moodEntries.reduce((sum, entry) => {
      return sum + (moodLevelMap[entry.mood] || 3);
    }, 0) / moodEntries.length;

    // Determine trend (improving, declining, stable)
    let trend = 'stable';
    if (moodEntries.length >= 3) {
      const recentAvg = moodEntries.slice(0, Math.ceil(moodEntries.length / 2))
        .reduce((sum, e) => sum + (moodLevelMap[e.mood] || 3), 0) / Math.ceil(moodEntries.length / 2);
      const olderAvg = moodEntries.slice(Math.ceil(moodEntries.length / 2))
        .reduce((sum, e) => sum + (moodLevelMap[e.mood] || 3), 0) / Math.floor(moodEntries.length / 2);
      
      if (recentAvg > olderAvg + 0.5) trend = 'improving';
      else if (recentAvg < olderAvg - 0.5) trend = 'declining';
    }

    // Calculate consistency (how regular are mood check-ins)
    const consistency = moodEntries.length >= days * 0.7 ? 'high' : 
                       moodEntries.length >= days * 0.4 ? 'medium' : 'low';

    // Get most recent mood
    const recentMood = moodEntries[0];

    // Analyze stress and energy levels
    const avgStressLevel = moodEntries
      .filter(e => e.stressLevel)
      .reduce((sum, e) => sum + e.stressLevel, 0) / (moodEntries.filter(e => e.stressLevel).length || 1);
    
    const avgEnergyLevel = moodEntries
      .filter(e => e.energyLevel)
      .reduce((sum, e) => sum + e.energyLevel, 0) / (moodEntries.filter(e => e.energyLevel).length || 1);

    return {
      trend,
      avgMoodLevel: parseFloat(avgMoodLevel.toFixed(2)),
      avgStressLevel: parseFloat(avgStressLevel.toFixed(2)),
      avgEnergyLevel: parseFloat(avgEnergyLevel.toFixed(2)),
      consistency,
      hasData: true,
      recentMood: {
        mood: recentMood.mood,
        date: recentMood.date,
        note: recentMood.note
      },
      totalEntries: moodEntries.length
    };
  } catch (error) {
    console.error('Error analyzing mood trend:', error);
    return {
      trend: 'neutral',
      avgMoodLevel: 3,
      consistency: 'low',
      hasData: false,
      recentMood: null,
      totalEntries: 0
    };
  }
};

/**
 * Get user's current emotional state for personalization
 * @param {ObjectId} userId - User ID
 * @returns {Object} Current emotional state
 */
const getCurrentEmotionalState = async (userId) => {
  try {
    // Get today's mood
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMood = await MoodTracking.findOne({
      userId,
      date: { $gte: today }
    }).sort({ createdAt: -1 });

    // Get yesterday's mood for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(today);
    
    const yesterdayMood = await MoodTracking.findOne({
      userId,
      date: { $gte: yesterday, $lt: yesterdayEnd }
    }).sort({ createdAt: -1 });

    // Get 7-day trend
    const weekTrend = await analyzeMoodTrend(userId, 7);

    return {
      hasCheckedInToday: !!todayMood,
      todayMood: todayMood ? todayMood.mood : null,
      yesterdayMood: yesterdayMood ? yesterdayMood.mood : null,
      todayStressLevel: todayMood ? todayMood.stressLevel : null,
      todayEnergyLevel: todayMood ? todayMood.energyLevel : null,
      weekTrend: weekTrend.trend,
      avgMoodLevel: weekTrend.avgMoodLevel,
      consistency: weekTrend.consistency
    };
  } catch (error) {
    console.error('Error getting current emotional state:', error);
    return {
      hasCheckedInToday: false,
      todayMood: null,
      yesterdayMood: null,
      weekTrend: 'neutral',
      avgMoodLevel: 3,
      consistency: 'low'
    };
  }
};

/**
 * Analyze best time for studying based on mood patterns
 * @param {ObjectId} userId - User ID
 * @returns {Object} Best study time recommendations
 */
const analyzeBestStudyTime = async (userId) => {
  try {
    const moodEntries = await MoodTracking.find({
      userId,
      energyLevel: { $exists: true }
    }).sort({ date: -1 }).limit(30);

    if (moodEntries.length === 0) {
      return {
        recommendation: 'morning',
        confidence: 'low',
        reason: 'Chưa có đủ dữ liệu để phân tích'
      };
    }

    // Group by time of day
    const timeGroups = {
      morning: [],   // 6-12
      afternoon: [], // 12-18
      evening: []    // 18-24
    };

    moodEntries.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeGroups.morning.push(entry);
      else if (hour >= 12 && hour < 18) timeGroups.afternoon.push(entry);
      else if (hour >= 18) timeGroups.evening.push(entry);
    });

    // Calculate average energy for each time period
    const avgEnergy = {};
    for (const [period, entries] of Object.entries(timeGroups)) {
      if (entries.length > 0) {
        avgEnergy[period] = entries.reduce((sum, e) => sum + (e.energyLevel || 3), 0) / entries.length;
      } else {
        avgEnergy[period] = 0;
      }
    }

    // Find best time
    const bestTime = Object.entries(avgEnergy).sort((a, b) => b[1] - a[1])[0];
    const confidence = moodEntries.length >= 20 ? 'high' : moodEntries.length >= 10 ? 'medium' : 'low';

    return {
      recommendation: bestTime[0],
      avgEnergy: parseFloat(bestTime[1].toFixed(2)),
      confidence,
      reason: `Dựa trên ${moodEntries.length} lần ghi nhận, bạn có năng lượng cao nhất vào ${
        bestTime[0] === 'morning' ? 'buổi sáng' :
        bestTime[0] === 'afternoon' ? 'buổi chiều' : 'buổi tối'
      }`
    };
  } catch (error) {
    console.error('Error analyzing best study time:', error);
    return {
      recommendation: 'morning',
      confidence: 'low',
      reason: 'Không thể phân tích dữ liệu'
    };
  }
};

/**
 * Get mood-based encouragement level
 * @param {Object} emotionalState - Current emotional state
 * @returns {String} Encouragement level: 'gentle', 'normal', 'energetic'
 */
const getEncouragementLevel = (emotionalState) => {
  const { todayMood, todayStressLevel, todayEnergyLevel, weekTrend, avgMoodLevel } = emotionalState;

  // If stressed or low mood, use gentle encouragement
  if (todayStressLevel >= 4 || avgMoodLevel < 2.5 || weekTrend === 'declining') {
    return 'gentle';
  }

  // If energetic and happy, use energetic encouragement
  if (todayEnergyLevel >= 4 || avgMoodLevel > 4 || weekTrend === 'improving') {
    return 'energetic';
  }

  return 'normal';
};

module.exports = {
  analyzeMoodTrend,
  getCurrentEmotionalState,
  analyzeBestStudyTime,
  getEncouragementLevel
};
