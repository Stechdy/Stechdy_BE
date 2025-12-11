const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const {
  User,
  Task,
  StudySession,
  StudyTracker,
  SmartNote,
  AIStudyBuddy,
  MoodTracking,
  AIMoodInsight,
  Gamification,
  Streak,
  Settings,
  PremiumSubscription,
  ActivityLog,
  Analytics,
  Report,
  Notification,
  SystemConfig
} = require('./models');

// MongoDB connection string - update with your credentials
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Stechdy';

// Helper function to get dates in the past
const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Helper to generate random time within a day
const getRandomTimeOfDay = (baseDate, startHour = 8, endHour = 22) => {
  const date = new Date(baseDate);
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  return date;
};

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    await StudySession.deleteMany({});
    await StudyTracker.deleteMany({});
    await SmartNote.deleteMany({});
    await AIStudyBuddy.deleteMany({});
    await MoodTracking.deleteMany({});
    await AIMoodInsight.deleteMany({});
    await Gamification.deleteMany({});
    await Streak.deleteMany({});
    await Settings.deleteMany({});
    await PremiumSubscription.deleteMany({});
    await ActivityLog.deleteMany({});
    await Analytics.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});
    await SystemConfig.deleteMany({});
    console.log('✅ Collections cleared');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin and users
    console.log('👥 Creating users (including admin)...');
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@stechdy.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        premiumStatus: 'premium',
        role: 'admin',
        isVerified: true,
        joinedAt: getDaysAgo(180),
        lastLogin: getDaysAgo(0),
        level: 10,
        xp: 1500,
        streakCount: 45,
        bio: 'System Administrator',
        settings: {
          notification: true,
          sounds: true,
          privacy: 'private'
        }
      },
      {
        name: 'Moderator User',
        email: 'moderator@stechdy.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=44',
        premiumStatus: 'premium',
        role: 'moderator',
        isVerified: true,
        joinedAt: getDaysAgo(150),
        lastLogin: getDaysAgo(1),
        level: 8,
        xp: 890,
        streakCount: 30,
        bio: 'Community Moderator',
        settings: {
          notification: true,
          sounds: true,
          privacy: 'private'
        }
      },
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@email.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        premiumStatus: 'premium',
        isVerified: true,
        joinedAt: getDaysAgo(90),
        lastLogin: getDaysAgo(0),
        level: 5,
        xp: 450,
        streakCount: 12,
        bio: 'Passionate learner and computer science student',
        phone: '+1234567890',
        settings: {
          notification: true,
          sounds: true,
          privacy: 'private'
        }
      },
      {
        name: 'Sarah Martinez',
        email: 'sarah.martinez@email.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
        premiumStatus: 'free',
        isVerified: true,
        joinedAt: getDaysAgo(60),
        lastLogin: getDaysAgo(2),
        level: 3,
        xp: 280,
        streakCount: 7,
        bio: 'Love learning new things every day!',
        settings: {
          notification: true,
          sounds: false,
          privacy: 'public'
        }
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        premiumStatus: 'premium',
        isVerified: true,
        joinedAt: getDaysAgo(120),
        lastLogin: getDaysAgo(0),
        level: 7,
        xp: 150,
        streakCount: 21,
        bio: 'Engineering student focused on excellence',
        settings: {
          notification: true,
          sounds: true,
          privacy: 'friends'
        }
      },
      {
        name: 'Emma Williams',
        email: 'emma.williams@email.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=9',
        premiumStatus: 'free',
        isVerified: false,
        joinedAt: getDaysAgo(30),
        lastLogin: getDaysAgo(5),
        level: 2,
        xp: 75,
        streakCount: 3,
        bio: 'Just started my learning journey',
        settings: {
          notification: false,
          sounds: true,
          privacy: 'private'
        }
      },
      {
        name: 'David Brown',
        email: 'david.brown@email.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        premiumStatus: 'free',
        isVerified: true,
        joinedAt: getDaysAgo(45),
        lastLogin: getDaysAgo(1),
        level: 4,
        xp: 320,
        streakCount: 5,
        bio: 'Learning is a lifetime journey',
        settings: {
          notification: true,
          sounds: true,
          privacy: 'private'
        }
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create Tasks (20 tasks distributed among users)
    console.log('📝 Creating tasks...');
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'English Literature', 'Computer Science', 'Psychology'];
    const taskTemplates = [
      { title: 'Complete Chapter 5 homework', desc: 'Solve all practice problems from the textbook' },
      { title: 'Review lecture notes', desc: 'Go through and summarize key concepts' },
      { title: 'Prepare presentation', desc: 'Create slides for next week\'s presentation' },
      { title: 'Read assigned chapters', desc: 'Read chapters 7-9 and take notes' },
      { title: 'Practice problems set', desc: 'Work through the problem set provided by professor' },
      { title: 'Write essay outline', desc: 'Create detailed outline for upcoming essay' },
      { title: 'Lab report', desc: 'Complete lab report from Monday\'s experiment' },
      { title: 'Study for midterm', desc: 'Review all materials covered so far' },
      { title: 'Group project work', desc: 'Work on assigned portion of group project' },
      { title: 'Quiz preparation', desc: 'Study for Friday\'s quiz' }
    ];

    const tasks = [];
    let taskIndex = 0;
    for (const user of users) {
      for (let i = 0; i < 4; i++) {
        const template = taskTemplates[taskIndex % taskTemplates.length];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const daysOffset = Math.floor(Math.random() * 20) - 10;
        const statuses = ['todo', 'in-progress', 'done'];
        const priorities = ['low', 'medium', 'high'];
        
        const task = await Task.create({
          userId: user._id,
          title: `${subject}: ${template.title}`,
          description: template.desc,
          dueDate: getDaysAgo(-daysOffset),
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          subject: subject,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          reminder: {
            enabled: Math.random() > 0.5,
            time: getDaysAgo(-daysOffset - 1)
          },
          repeatOptions: {
            enabled: Math.random() > 0.7,
            frequency: 'weekly',
            interval: 1
          }
        });
        tasks.push(task);
        taskIndex++;
      }
    }
    console.log(`✅ Created ${tasks.length} tasks`);

    // Create Study Sessions (10 sessions)
    console.log('📚 Creating study sessions...');
    const studySessions = [];
    for (const user of users) {
      for (let i = 0; i < 2; i++) {
        const dayOffset = Math.floor(Math.random() * 14) + 1;
        const baseDate = getDaysAgo(dayOffset);
        const startTime = getRandomTimeOfDay(baseDate, 8, 20);
        const duration = 30 + Math.floor(Math.random() * 90); // 30-120 minutes
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        const userTasks = tasks.filter(t => t.userId.toString() === user._id.toString());
        const linkedTask = Math.random() > 0.5 && userTasks.length > 0 
          ? userTasks[Math.floor(Math.random() * userTasks.length)]._id 
          : null;

        const session = await StudySession.create({
          userId: user._id,
          taskId: linkedTask,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          focusLevel: Math.floor(Math.random() * 3) + 3 // 3-5
        });
        studySessions.push(session);
      }
    }
    console.log(`✅ Created ${studySessions.length} study sessions`);

    // Create Study Trackers
    console.log('📊 Creating study trackers...');
    const studyTrackers = [];
    for (const user of users) {
      const userSessions = studySessions.filter(s => s.userId.toString() === user._id.toString());
      
      // Group sessions by date
      const sessionsByDate = {};
      userSessions.forEach(session => {
        const dateKey = session.startTime.toISOString().split('T')[0];
        if (!sessionsByDate[dateKey]) {
          sessionsByDate[dateKey] = [];
        }
        sessionsByDate[dateKey].push(session);
      });

      // Create tracker for each date
      for (const [dateStr, sessions] of Object.entries(sessionsByDate)) {
        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
        
        // Calculate subject breakdown
        const subjectMap = {};
        sessions.forEach(s => {
          if (!subjectMap[s.subject]) {
            subjectMap[s.subject] = 0;
          }
          subjectMap[s.subject] += s.duration;
        });
        
        const subjectBreakdown = Object.entries(subjectMap).map(([subject, minutes]) => ({
          subject,
          minutes
        }));

        const tracker = await StudyTracker.create({
          userId: user._id,
          date: new Date(dateStr),
          totalMinutes: totalMinutes,
          sessions: sessions.map(s => s._id),
          subjectBreakdown: subjectBreakdown
        });
        studyTrackers.push(tracker);
      }
    }
    console.log(`✅ Created ${studyTrackers.length} study trackers`);

    // Create Smart Notes
    console.log('📓 Creating smart notes...');
    const noteContents = [
      {
        title: 'Calculus Integration Techniques',
        content: 'Integration by parts formula: ∫u dv = uv - ∫v du. Important to choose u and dv correctly. LIATE rule helps: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.',
        tags: ['calculus', 'integration', 'math'],
        aiSummary: 'Notes on integration by parts technique and LIATE rule for selecting u and dv components.',
        aiKeywords: ['integration', 'calculus', 'LIATE', 'u-substitution']
      },
      {
        title: 'Newton\'s Laws of Motion',
        content: 'First Law: Object at rest stays at rest unless acted upon. Second Law: F=ma. Third Law: Every action has equal and opposite reaction. Key for understanding dynamics and kinematics.',
        tags: ['physics', 'mechanics', 'newton'],
        aiSummary: 'Summary of Newton\'s three fundamental laws of motion and their applications.',
        aiKeywords: ['force', 'acceleration', 'inertia', 'reaction']
      },
      {
        title: 'Organic Chemistry Functional Groups',
        content: 'Alcohols: -OH group. Aldehydes: -CHO. Ketones: C=O. Carboxylic acids: -COOH. Amines: -NH2. Understanding functional groups is essential for reaction mechanisms.',
        tags: ['chemistry', 'organic', 'functional-groups'],
        aiSummary: 'Overview of common organic chemistry functional groups and their structures.',
        aiKeywords: ['alcohol', 'aldehyde', 'ketone', 'carboxylic acid', 'amine']
      },
      {
        title: 'World War II Timeline',
        content: '1939: War begins with invasion of Poland. 1941: Pearl Harbor, US enters war. 1944: D-Day invasion. 1945: Germany surrenders May, Japan August after atomic bombs.',
        tags: ['history', 'WWII', 'timeline'],
        aiSummary: 'Major events and dates of World War II from 1939-1945.',
        aiKeywords: ['Pearl Harbor', 'D-Day', 'atomic bomb', 'surrender']
      },
      {
        title: 'Data Structures - Binary Trees',
        content: 'Binary tree: Each node has at most 2 children. BST: Left child < parent < right child. Operations: Insert O(log n), Search O(log n), Delete O(log n) average case.',
        tags: ['computer-science', 'data-structures', 'trees'],
        aiSummary: 'Binary tree fundamentals and time complexity of common operations.',
        aiKeywords: ['BST', 'binary tree', 'time complexity', 'nodes']
      }
    ];

    const smartNotes = [];
    for (const user of users) {
      const numNotes = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numNotes; i++) {
        const noteTemplate = noteContents[Math.floor(Math.random() * noteContents.length)];
        const userTasks = tasks.filter(t => t.userId.toString() === user._id.toString());
        const linkedTasks = userTasks.slice(0, Math.floor(Math.random() * 2)).map(t => t._id);

        const note = await SmartNote.create({
          userId: user._id,
          title: noteTemplate.title,
          content: noteTemplate.content,
          tags: noteTemplate.tags,
          linkedTasks: linkedTasks,
          aiSummary: noteTemplate.aiSummary,
          aiKeywords: noteTemplate.aiKeywords,
          isPinned: Math.random() > 0.7,
          color: ['#ffffff', '#fff3cd', '#d1ecf1', '#d4edda', '#f8d7da'][Math.floor(Math.random() * 5)]
        });
        smartNotes.push(note);
      }
    }
    console.log(`✅ Created ${smartNotes.length} smart notes`);

    // Create AI Study Buddy conversations
    console.log('🤖 Creating AI Study Buddy data...');
    const aiStudyBuddies = [];
    const conversationTemplates = [
      [
        { role: 'user', content: 'Can you help me understand integration by parts?' },
        { role: 'assistant', content: 'Of course! Integration by parts is based on the product rule for differentiation. The formula is ∫u dv = uv - ∫v du. Would you like me to walk through an example?' },
        { role: 'user', content: 'Yes, please show me an example.' },
        { role: 'assistant', content: 'Let\'s solve ∫x·e^x dx. We choose u = x (gets simpler when differentiated) and dv = e^x dx. Then du = dx and v = e^x. Applying the formula: ∫x·e^x dx = x·e^x - ∫e^x dx = x·e^x - e^x + C = e^x(x-1) + C' }
      ],
      [
        { role: 'user', content: 'What\'s the best way to prepare for my chemistry exam?' },
        { role: 'assistant', content: 'Here\'s a solid study plan: 1) Review your notes and highlight key concepts, 2) Work through practice problems, 3) Create flashcards for reactions and formulas, 4) Study in focused 45-minute blocks with breaks. What specific topics will the exam cover?' },
        { role: 'user', content: 'Mostly organic chemistry and functional groups' },
        { role: 'assistant', content: 'Great! Focus on understanding functional group reactivity and reaction mechanisms. Practice drawing structures and predicting products. Would you like me to quiz you on functional groups?' }
      ],
      [
        { role: 'user', content: 'I\'m feeling overwhelmed with all my assignments' },
        { role: 'assistant', content: 'I understand that can be stressful. Let\'s break it down: 1) List all your assignments, 2) Prioritize by due date and difficulty, 3) Break large tasks into smaller steps, 4) Schedule specific times for each. Would you like help creating a study schedule?' }
      ]
    ];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const conversationTemplate = conversationTemplates[i % conversationTemplates.length];
      const chatHistory = conversationTemplate.map((msg, idx) => ({
        role: msg.role,
        content: msg.content,
        timestamp: getDaysAgo(7 - idx)
      }));

      const aiStudyBuddy = await AIStudyBuddy.create({
        userId: user._id,
        chatHistory: chatHistory,
        totalMessages: chatHistory.length,
        lastInteraction: chatHistory[chatHistory.length - 1].timestamp
      });
      aiStudyBuddies.push(aiStudyBuddy);
    }
    console.log(`✅ Created ${aiStudyBuddies.length} AI Study Buddy records`);

    // Create Mood Tracking entries (7 per user)
    console.log('😊 Creating mood tracking entries...');
    const emotions = [
      ['happy', 'motivated', 'energetic'],
      ['focused', 'calm', 'content'],
      ['stressed', 'anxious', 'overwhelmed'],
      ['tired', 'frustrated'],
      ['excited', 'confident', 'motivated']
    ];

    const moodNotes = [
      'Had a productive study session today!',
      'Feeling good about my progress',
      'Struggling with this material, need to review',
      'Great day overall, completed all my tasks',
      'Feeling a bit tired but staying focused',
      'Anxious about upcoming exam',
      'Really enjoying learning this topic'
    ];

    const moodTrackings = [];
    for (const user of users) {
      for (let i = 0; i < 7; i++) {
        const moodValue = Math.floor(Math.random() * 5) + 1;
        const emotionSet = emotions[moodValue - 1] || emotions[2];
        const numEmotions = Math.floor(Math.random() * 2) + 1;
        const selectedEmotions = emotionSet.slice(0, numEmotions);

        const mood = await MoodTracking.create({
          userId: user._id,
          date: getDaysAgo(i),
          mood: moodValue,
          emotionTags: selectedEmotions,
          note: moodNotes[Math.floor(Math.random() * moodNotes.length)]
        });
        moodTrackings.push(mood);
      }
    }
    console.log(`✅ Created ${moodTrackings.length} mood tracking entries`);

    // Create AI Mood Insights
    console.log('🧠 Creating AI mood insights...');
    const insightTemplates = [
      {
        insightText: 'Your mood has been consistently positive over the past week, with an average rating of 4.2/5.',
        behaviorPattern: 'You tend to feel most productive and energetic in the morning hours based on your study session times.',
        recommendation: 'Continue scheduling challenging tasks during your peak energy times. Consider maintaining this positive momentum with regular breaks.'
      },
      {
        insightText: 'You\'ve experienced some stress related to upcoming deadlines.',
        behaviorPattern: 'Stress levels increase 2-3 days before major assignments are due.',
        recommendation: 'Try starting assignments earlier to reduce deadline pressure. Consider using the Pomodoro technique for better time management.'
      },
      {
        insightText: 'Your focus levels are highest when studying Mathematics and Computer Science subjects.',
        behaviorPattern: 'Sessions in these subjects average 4.5/5 focus rating, while other subjects average 3.2/5.',
        recommendation: 'Apply the techniques that work well for technical subjects to other areas. Consider studying challenging subjects during your high-focus periods.'
      },
      {
        insightText: 'You\'re maintaining a healthy balance between study and rest.',
        behaviorPattern: 'Your mood improves on days with 2-3 study sessions with breaks, compared to marathon study days.',
        recommendation: 'Continue with your current schedule of distributed study sessions. Your body and mind benefit from this approach.'
      }
    ];

    const aiMoodInsights = [];
    for (const user of users) {
      const userMoods = moodTrackings.filter(m => m.userId.toString() === user._id.toString());
      const numInsights = Math.min(Math.floor(Math.random() * 3) + 2, userMoods.length);
      
      for (let i = 0; i < numInsights; i++) {
        const template = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
        const insight = await AIMoodInsight.create({
          userId: user._id,
          moodId: userMoods[i]._id,
          insightText: template.insightText,
          behaviorPattern: template.behaviorPattern,
          recommendation: template.recommendation,
          confidence: Math.floor(Math.random() * 20) + 75 // 75-95
        });
        aiMoodInsights.push(insight);
      }
    }
    console.log(`✅ Created ${aiMoodInsights.length} AI mood insights`);

    // Create Gamification records
    console.log('🎮 Creating gamification records...');
    const xpReasons = [
      'Completed a task',
      'Finished a study session',
      'Maintained streak',
      'Reached daily goal',
      'Earned achievement',
      'Helped another student',
      'Completed quiz'
    ];

    const gamifications = [];
    for (const user of users) {
      const numLogs = Math.floor(Math.random() * 10) + 5;
      const xpLogs = [];
      let totalXP = 0;

      for (let i = 0; i < numLogs; i++) {
        const xpAmount = Math.floor(Math.random() * 50) + 10;
        totalXP += xpAmount;
        xpLogs.push({
          amount: xpAmount,
          reason: xpReasons[Math.floor(Math.random() * xpReasons.length)],
          createdAt: getDaysAgo(numLogs - i)
        });
      }

      const gamification = await Gamification.create({
        userId: user._id,
        currentLevel: user.level,
        currentXP: user.xp,
        requiredXP: Math.floor(100 * Math.pow(1.5, user.level - 1)),
        xpLogs: xpLogs,
        totalXPEarned: totalXP,
        badges: [
          {
            name: 'First Steps',
            description: 'Completed your first study session',
            earnedAt: getDaysAgo(numLogs)
          },
          {
            name: 'Dedicated Learner',
            description: 'Maintained a 7-day streak',
            earnedAt: getDaysAgo(Math.floor(numLogs / 2))
          }
        ]
      });
      gamifications.push(gamification);
    }
    console.log(`✅ Created ${gamifications.length} gamification records`);

    // Create Streak records
    console.log('🔥 Creating streak records...');
    const streaks = [];
    for (const user of users) {
      const streakHistory = [];
      for (let i = user.streakCount; i > 0; i--) {
        streakHistory.push({
          date: getDaysAgo(i),
          activityCount: Math.floor(Math.random() * 3) + 1
        });
      }

      const streak = await Streak.create({
        userId: user._id,
        lastActiveDate: getDaysAgo(0),
        longestStreak: Math.max(user.streakCount, Math.floor(user.streakCount * 1.5)),
        currentStreak: user.streakCount,
        streakHistory: streakHistory,
        totalActiveDays: streakHistory.length
      });
      streaks.push(streak);
    }
    console.log(`✅ Created ${streaks.length} streak records`);

    // Create Settings for each user
    console.log('⚙️ Creating settings...');
    const settingsRecords = [];
    const themes = ['light', 'dark', 'auto'];
    const languages = ['en', 'es', 'fr'];
    const studyTimes = ['morning', 'afternoon', 'evening', 'night'];

    for (const user of users) {
      const settings = await Settings.create({
        userId: user._id,
        notification: {
          enabled: true,
          taskReminders: true,
          studyReminders: true,
          moodCheckIn: Math.random() > 0.5,
          achievements: true,
          email: Math.random() > 0.5,
          push: true
        },
        sound: {
          enabled: user.settings.sounds,
          volume: Math.floor(Math.random() * 50) + 30,
          timerSound: ['bell', 'chime', 'soft'][Math.floor(Math.random() * 3)]
        },
        theme: {
          mode: themes[Math.floor(Math.random() * themes.length)],
          primaryColor: '#6366f1',
          accentColor: '#ec4899'
        },
        language: languages[Math.floor(Math.random() * languages.length)],
        studyTargets: {
          daily: {
            enabled: true,
            minutes: 90 + Math.floor(Math.random() * 90) // 90-180 minutes
          },
          weekly: {
            enabled: true,
            minutes: 600 + Math.floor(Math.random() * 600) // 600-1200 minutes
          },
          preferredStudyTime: studyTimes[Math.floor(Math.random() * studyTimes.length)]
        },
        privacy: {
          profileVisibility: user.settings.privacy,
          showActivity: Math.random() > 0.5,
          showStats: Math.random() > 0.3
        }
      });
      settingsRecords.push(settings);
    }
    console.log(`✅ Created ${settingsRecords.length} settings records`);

    // Create Premium Subscriptions (for premium users)
    console.log('💎 Creating premium subscriptions...');
    const premiumUsers = users.filter(u => u.premiumStatus === 'premium');
    const premiumSubscriptions = [];

    for (let i = 0; i < premiumUsers.length; i++) {
      const user = premiumUsers[i];
      const plan = i === 0 ? 'yearly' : 'monthly';
      const startDate = getDaysAgo(i === 0 ? 30 : 15);
      const endDate = new Date(startDate);
      
      if (plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscription = await PremiumSubscription.create({
        userId: user._id,
        plan: plan,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: plan === 'yearly' ? 99.99 : 9.99,
        currency: 'USD',
        paymentMethod: ['stripe', 'paypal', 'credit_card'][Math.floor(Math.random() * 3)],
        autoRenew: true
      });
      premiumSubscriptions.push(subscription);
    }
    console.log(`✅ Created ${premiumSubscriptions.length} premium subscriptions`);

    // Create Activity Logs
    console.log('📋 Creating activity logs...');
    const activityLogs = [];
    const adminUser = users.find(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user');

    for (const user of users) {
      // User login logs
      for (let i = 0; i < 5; i++) {
        activityLogs.push(await ActivityLog.create({
          userId: user._id,
          action: 'user_login',
          category: 'authentication',
          description: `User logged in successfully`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          severity: 'info'
        }));
      }

      // Task actions
      if (user.role === 'user') {
        activityLogs.push(await ActivityLog.create({
          userId: user._id,
          action: 'task_created',
          category: 'content',
          description: `Created a new task`,
          status: 'success',
          severity: 'info'
        }));
      }

      // Level up
      if (user.level > 2) {
        activityLogs.push(await ActivityLog.create({
          userId: user._id,
          action: 'level_up',
          category: 'gamification',
          description: `Leveled up to level ${user.level}`,
          status: 'success',
          severity: 'info'
        }));
      }
    }

    // Admin actions
    activityLogs.push(await ActivityLog.create({
      userId: adminUser._id,
      action: 'admin_action',
      category: 'admin',
      description: `Admin reviewed user reports`,
      status: 'success',
      severity: 'info'
    }));

    console.log(`✅ Created ${activityLogs.length} activity logs`);

    // Create Analytics
    console.log('📈 Creating analytics data...');
    const analyticsRecords = [];
    
    // Daily analytics for last 7 days
    for (let i = 7; i >= 0; i--) {
      analyticsRecords.push(await Analytics.create({
        date: getDaysAgo(i),
        type: 'daily',
        metrics: {
          totalUsers: users.length,
          activeUsers: Math.floor(users.length * (0.6 + Math.random() * 0.3)),
          newUsers: i === 7 ? 2 : Math.floor(Math.random() * 3),
          premiumUsers: premiumUsers.length,
          deletedUsers: 0,
          verifiedUsers: users.filter(u => u.isVerified).length,
          totalStudySessions: Math.floor(Math.random() * 20) + 10,
          totalStudyMinutes: Math.floor(Math.random() * 500) + 200,
          avgSessionDuration: Math.floor(Math.random() * 60) + 30,
          totalTasks: Math.floor(Math.random() * 30) + 20,
          completedTasks: Math.floor(Math.random() * 15) + 5,
          totalNotes: Math.floor(Math.random() * 10) + 5,
          avgMoodScore: 3.5 + Math.random(),
          totalMoodEntries: Math.floor(Math.random() * 15) + 5,
          avgUserLevel: 4.5,
          totalXPEarned: Math.floor(Math.random() * 500) + 100,
          avgStreak: 8,
          totalRevenue: premiumUsers.length * 9.99,
          newSubscriptions: i === 7 ? 1 : 0,
          cancelledSubscriptions: 0,
          activeSubscriptions: premiumUsers.length,
          aiChatMessages: Math.floor(Math.random() * 50) + 20,
          aiInsightsGenerated: Math.floor(Math.random() * 20) + 5
        },
        topSubjects: [
          { subject: 'Mathematics', count: 15, totalMinutes: 450 },
          { subject: 'Computer Science', count: 12, totalMinutes: 360 },
          { subject: 'Physics', count: 8, totalMinutes: 240 }
        ],
        topEmotions: [
          { emotion: 'focused', count: 25 },
          { emotion: 'motivated', count: 20 },
          { emotion: 'happy', count: 15 }
        ],
        userGrowth: i === 7 ? 12.5 : Math.random() * 5,
        revenueGrowth: i === 7 ? 8.3 : Math.random() * 3
      }));
    }

    console.log(`✅ Created ${analyticsRecords.length} analytics records`);

    // Create Reports
    console.log('📢 Creating reports...');
    const reports = [];
    
    reports.push(await Report.create({
      type: 'bug_report',
      reportedBy: regularUsers[0]._id,
      title: 'Study timer not working correctly',
      description: 'The study timer sometimes doesn\'t save the session properly when I close the app.',
      category: 'technical',
      priority: 'high',
      status: 'under_review',
      assignedTo: adminUser._id
    }));

    reports.push(await Report.create({
      type: 'feature_request',
      reportedBy: regularUsers[1]._id,
      title: 'Add dark mode theme',
      description: 'Please add a dark mode option for better eye comfort during night studying.',
      category: 'other',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: adminUser._id
    }));

    reports.push(await Report.create({
      type: 'content_report',
      reportedBy: regularUsers[2]._id,
      targetId: regularUsers[3]._id,
      targetType: 'User',
      title: 'Inappropriate username',
      description: 'This user has an offensive username that violates community guidelines.',
      category: 'inappropriate',
      priority: 'high',
      status: 'resolved',
      assignedTo: adminUser._id,
      resolvedBy: adminUser._id,
      resolvedAt: getDaysAgo(2),
      resolution: 'User has been contacted and agreed to change username.'
    }));

    console.log(`✅ Created ${reports.length} reports`);

    // Create Notifications
    console.log('🔔 Creating notifications...');
    const notifications = [];

    for (const user of regularUsers.slice(0, 3)) {
      // Task reminder
      notifications.push(await Notification.create({
        userId: user._id,
        type: 'task_reminder',
        title: 'Task Due Soon',
        message: 'Your task "Complete Chapter 5 homework" is due in 2 hours!',
        priority: 'high',
        isRead: Math.random() > 0.5,
        actionUrl: '/tasks',
        actionLabel: 'View Task'
      }));

      // Achievement notification
      notifications.push(await Notification.create({
        userId: user._id,
        type: 'achievement',
        title: 'New Badge Earned! 🏆',
        message: 'Congratulations! You\'ve earned the "7-Day Streak" badge!',
        priority: 'normal',
        isRead: false,
        actionUrl: '/achievements',
        actionLabel: 'View Badges'
      }));

      // System announcement
      notifications.push(await Notification.create({
        userId: user._id,
        type: 'announcement',
        title: 'New Features Available',
        message: 'Check out our new AI Study Buddy feature to get personalized learning assistance!',
        priority: 'normal',
        isRead: Math.random() > 0.3
      }));
    }

    console.log(`✅ Created ${notifications.length} notifications`);

    // Create System Config
    console.log('⚙️ Creating system configuration...');
    const systemConfigs = [];

    const configs = [
      { key: 'site_name', value: 'Stechdy', type: 'string', category: 'general', description: 'Application name', isPublic: true },
      { key: 'site_description', value: 'Your EdTech Productivity Platform', type: 'string', category: 'general', description: 'Site description', isPublic: true },
      { key: 'maintenance_mode', value: false, type: 'boolean', category: 'general', description: 'Enable maintenance mode', isPublic: false },
      { key: 'allow_registration', value: true, type: 'boolean', category: 'general', description: 'Allow new user registration', isPublic: false },
      { key: 'max_free_tasks', value: 50, type: 'number', category: 'limit', description: 'Maximum tasks for free users', isPublic: false },
      { key: 'max_premium_tasks', value: 500, type: 'number', category: 'limit', description: 'Maximum tasks for premium users', isPublic: false },
      { key: 'max_file_upload_size', value: 10485760, type: 'number', category: 'limit', description: 'Max file size in bytes (10MB)', isPublic: false },
      { key: 'monthly_premium_price', value: 9.99, type: 'number', category: 'payment', description: 'Monthly premium subscription price', isPublic: true },
      { key: 'yearly_premium_price', value: 99.99, type: 'number', category: 'payment', description: 'Yearly premium subscription price', isPublic: true },
      { key: 'ai_enabled', value: true, type: 'boolean', category: 'ai', description: 'Enable AI features', isPublic: false },
      { key: 'max_ai_requests_per_day', value: 100, type: 'number', category: 'ai', description: 'Max AI requests per user per day', isPublic: false },
      { key: 'xp_per_task', value: 10, type: 'number', category: 'gamification', description: 'XP earned per completed task', isPublic: false },
      { key: 'xp_per_study_hour', value: 50, type: 'number', category: 'gamification', description: 'XP earned per hour of study', isPublic: false },
      { key: 'email_verification_required', value: false, type: 'boolean', category: 'security', description: 'Require email verification', isPublic: false },
      { key: 'max_login_attempts', value: 5, type: 'number', category: 'security', description: 'Max login attempts before lock', isPublic: false }
    ];

    for (const config of configs) {
      systemConfigs.push(await SystemConfig.create({
        ...config,
        lastModifiedBy: adminUser._id
      }));
    }

    console.log(`✅ Created ${systemConfigs.length} system configuration entries`);

    // Summary
    console.log('\n🎉 Seed completed successfully!');
    console.log('=================================');
    console.log(`👥 Users: ${users.length} (${users.filter(u => u.role === 'admin').length} admin, ${users.filter(u => u.role === 'moderator').length} moderator)`);
    console.log(`📝 Tasks: ${tasks.length}`);
    console.log(`📚 Study Sessions: ${studySessions.length}`);
    console.log(`📊 Study Trackers: ${studyTrackers.length}`);
    console.log(`📓 Smart Notes: ${smartNotes.length}`);
    console.log(`🤖 AI Study Buddies: ${aiStudyBuddies.length}`);
    console.log(`😊 Mood Trackings: ${moodTrackings.length}`);
    console.log(`🧠 AI Mood Insights: ${aiMoodInsights.length}`);
    console.log(`🎮 Gamifications: ${gamifications.length}`);
    console.log(`🔥 Streaks: ${streaks.length}`);
    console.log(`⚙️  Settings: ${settingsRecords.length}`);
    console.log(`💎 Premium Subscriptions: ${premiumSubscriptions.length}`);
    console.log(`📋 Activity Logs: ${activityLogs.length}`);
    console.log(`📈 Analytics: ${analyticsRecords.length}`);
    console.log(`📢 Reports: ${reports.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`⚙️  System Configs: ${systemConfigs.length}`);
    console.log('=================================');
    console.log('\n📧 Test Credentials:');
    console.log('Admin: admin@stechdy.com / password123');
    console.log('Moderator: moderator@stechdy.com / password123');
    console.log('User: alex.johnson@email.com / password123');
    console.log('(All users have the same password for testing)\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the seed function
seedDatabase();
