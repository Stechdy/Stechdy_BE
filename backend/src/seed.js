const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const {
  User,
  Task,
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
  SystemConfig,
  // AI Scheduling System models
  Semester,
  Subject,
  BusySchedule,
  StudyTimetable,
  StudySessionSchedule,
  Deadline,
  Reminder,
  NotificationLog,
  AIInput,
  AIGenerationResult
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

    // Drop all indexes and recreate them properly
    console.log('🔧 Rebuilding indexes...');
    try {
      const userCollection = mongoose.connection.collection('users');
      
      // Drop ALL indexes except _id (which cannot be dropped)
      const indexes = await userCollection.indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await userCollection.dropIndex(index.name);
            console.log(`✅ Dropped index: ${index.name}`);
          } catch (err) {
            console.log(`Could not drop ${index.name}`);
          }
        }
      }
      
      // Force Mongoose to sync indexes from the schema
      await User.syncIndexes();
      console.log('✅ Synchronized indexes from User schema');
      
      // Verify the googleId index is sparse
      const newIndexes = await userCollection.indexes();
      const googleIdIndex = newIndexes.find(idx => idx.key && idx.key.googleId);
      if (googleIdIndex) {
        console.log(`googleId index details: sparse=${googleIdIndex.sparse}, unique=${googleIdIndex.unique}`);
        
        // If it's not sparse, drop it and recreate manually
        if (!googleIdIndex.sparse) {
          console.log('⚠️  googleId index is not sparse, fixing...');
          await userCollection.dropIndex('googleId_1');
          await userCollection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
          console.log('✅ Manually created sparse unique index for googleId');
        }
      }
      
    } catch (indexError) {
      console.error('Index rebuild error:', indexError.message);
    }

    // Clear all collections
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
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
    // Clear AI Scheduling collections
    await Semester.deleteMany({});
    await Subject.deleteMany({});
    await BusySchedule.deleteMany({});
    await StudyTimetable.deleteMany({});
    await StudySessionSchedule.deleteMany({});
    await Deadline.deleteMany({});
    await Reminder.deleteMany({});
    await NotificationLog.deleteMany({});
    await AIInput.deleteMany({});
    await AIGenerationResult.deleteMany({});
    console.log('✅ Collections cleared');

    // Password will be hashed by User model's pre-save hook
    const plainPassword = 'password123';

    // Create admin and users
    console.log('👥 Creating users (including admin)...');
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@stechdy.com',
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        premiumStatus: 'premium',
        role: 'admin',
        isVerified: true,
        authProvider: 'local',
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
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=44',
        premiumStatus: 'premium',
        role: 'moderator',
        isVerified: true,
        authProvider: 'local',
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
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        premiumStatus: 'premium',
        isVerified: true,
        authProvider: 'local',
        joinedAt: getDaysAgo(90),
        lastLogin: getDaysAgo(0),
        level: 5,
        xp: 450,
        streakCount: 12,
        bio: 'Passionate learner and computer science student',
        phone: '+1234567890',
        timezone: 'Asia/Ho_Chi_Minh',
        notificationSettings: {
          dailyEmail: true,
          studyReminder: true,
          deadlineReminder: true,
          weeklyReport: true,
          aiSuggestions: true
        },
        settings: {
          notification: true,
          sounds: true,
          privacy: 'private'
        }
      },
      {
        name: 'Sarah Martinez',
        email: 'sarah.martinez@email.com',
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
        premiumStatus: 'free',
        isVerified: true,
        authProvider: 'local',
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
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        premiumStatus: 'premium',
        isVerified: true,
        authProvider: 'local',
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
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=9',
        premiumStatus: 'free',
        isVerified: false,
        authProvider: 'local',
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
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        premiumStatus: 'free',
        isVerified: true,
        authProvider: 'local',
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
      },
      {
        name: 'Tai Nguyen',
        email: 'tai05112004@gmail.com',
        passwordHash: plainPassword,
        avatarUrl: 'https://i.pravatar.cc/150?img=68',
        premiumStatus: 'premium',
        isVerified: true,
        authProvider: 'local',
        joinedAt: getDaysAgo(30),
        lastLogin: getDaysAgo(0),
        level: 6,
        xp: 520,
        streakCount: 15,
        bio: 'Computer Science student passionate about coding',
        phone: '+84912345678',
        timezone: 'Asia/Ho_Chi_Minh',
        notificationSettings: {
          dailyEmail: true,
          studyReminder: true,
          deadlineReminder: true,
          weeklyReport: true,
          aiSuggestions: true
        },
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
    console.log(` Smart Notes: ${smartNotes.length}`);
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

    // ============================================================
    // AI SCHEDULING SYSTEM - COMPREHENSIVE TEST DATA
    // ============================================================
    
    const alexUser = users.find(u => u.email === 'alex.johnson@email.com');
    
    console.log('📅 Creating Semesters...');
    const semesters = await Semester.create([
      {
        userId: alexUser._id,
        name: 'Fall 2025',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-20'),
        isActive: true,
        academicYear: '2025-2026',
        term: 'Fall',
        totalCredits: 18,
        notes: 'Current semester - Heavy workload with major courses'
      },
      {
        userId: alexUser._id,
        name: 'Summer 2025',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-15'),
        isActive: false,
        academicYear: '2024-2025',
        term: 'Summer',
        totalCredits: 6,
        notes: 'Completed summer courses'
      }
    ]);
    console.log(`✅ Created ${semesters.length} semesters`);

    const fallSemester = semesters[0];

    console.log('📚 Creating Subjects...');
    const aiSubjects = await Subject.create([
      {
        userId: alexUser._id,
        semesterId: fallSemester._id,
        subjectName: 'Data Structures & Algorithms',
        subjectCode: 'CS301',
        credits: 4,
        instructor: 'Dr. Sarah Chen',
        color: '#FF6B6B',
        syllabus: 'Comprehensive study of data structures including arrays, linked lists, trees, graphs, and algorithm analysis',
        syllabusStructure: [
          { topic: 'Arrays and Linked Lists', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(45) },
          { topic: 'Stacks and Queues', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(38) },
          { topic: 'Trees (Binary, BST, AVL)', estimatedHours: 12, isCompleted: true, completedAt: getDaysAgo(25) },
          { topic: 'Graphs and Graph Algorithms', estimatedHours: 10, isCompleted: false },
          { topic: 'Sorting Algorithms', estimatedHours: 8, isCompleted: false },
          { topic: 'Dynamic Programming', estimatedHours: 12, isCompleted: false }
        ],
        priorityLevel: 'critical',
        difficultyLevel: 'hard',
        estimatedWeeklyHours: 8,
        progress: 45,
        notes: 'Most important course - focus on interview prep'
      },
      {
        userId: alexUser._id,
        semesterId: fallSemester._id,
        subjectName: 'Database Systems',
        subjectCode: 'CS302',
        credits: 3,
        instructor: 'Prof. Michael Rodriguez',
        color: '#4ECDC4',
        syllabus: 'Relational databases, SQL, normalization, transactions, and NoSQL concepts',
        syllabusStructure: [
          { topic: 'Relational Model & SQL Basics', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(50) },
          { topic: 'Advanced SQL & Joins', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(35) },
          { topic: 'Normalization (1NF-BCNF)', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(28) },
          { topic: 'Indexing & Query Optimization', estimatedHours: 8, isCompleted: false },
          { topic: 'Transactions & Concurrency', estimatedHours: 6, isCompleted: false },
          { topic: 'NoSQL Databases', estimatedHours: 4, isCompleted: false }
        ],
        priorityLevel: 'high',
        difficultyLevel: 'medium',
        estimatedWeeklyHours: 6,
        progress: 52,
        notes: 'Practical project due in 3 weeks'
      },
      {
        userId: alexUser._id,
        semesterId: fallSemester._id,
        subjectName: 'Operating Systems',
        subjectCode: 'CS303',
        credits: 4,
        instructor: 'Dr. Emily Thompson',
        color: '#95E1D3',
        syllabus: 'Process management, memory management, file systems, and system security',
        syllabusStructure: [
          { topic: 'Introduction & System Calls', estimatedHours: 4, isCompleted: true, completedAt: getDaysAgo(48) },
          { topic: 'Process Scheduling', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(40) },
          { topic: 'Threads & Concurrency', estimatedHours: 8, isCompleted: false },
          { topic: 'Memory Management', estimatedHours: 10, isCompleted: false },
          { topic: 'File Systems', estimatedHours: 8, isCompleted: false },
          { topic: 'Security & Protection', estimatedHours: 6, isCompleted: false }
        ],
        priorityLevel: 'high',
        difficultyLevel: 'very_hard',
        estimatedWeeklyHours: 7,
        progress: 27,
        notes: 'Complex concepts - need extra study time'
      },
      {
        userId: alexUser._id,
        semesterId: fallSemester._id,
        subjectName: 'Web Development',
        subjectCode: 'CS304',
        credits: 3,
        instructor: 'Prof. James Wilson',
        color: '#F38181',
        syllabus: 'Modern web technologies: HTML5, CSS3, JavaScript, React, Node.js, and deployment',
        syllabusStructure: [
          { topic: 'HTML5 & CSS3 Fundamentals', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(52) },
          { topic: 'JavaScript ES6+', estimatedHours: 10, isCompleted: true, completedAt: getDaysAgo(42) },
          { topic: 'React Basics & Hooks', estimatedHours: 12, isCompleted: true, completedAt: getDaysAgo(30) },
          { topic: 'Node.js & Express', estimatedHours: 10, isCompleted: false },
          { topic: 'Database Integration', estimatedHours: 8, isCompleted: false },
          { topic: 'Deployment & DevOps', estimatedHours: 4, isCompleted: false }
        ],
        priorityLevel: 'medium',
        difficultyLevel: 'medium',
        estimatedWeeklyHours: 5,
        progress: 56,
        notes: 'Fun practical course with portfolio project'
      },
      {
        userId: alexUser._id,
        semesterId: fallSemester._id,
        subjectName: 'Linear Algebra',
        subjectCode: 'MATH201',
        credits: 4,
        instructor: 'Dr. Anna Kowalski',
        color: '#AA96DA',
        syllabus: 'Vector spaces, matrices, eigenvalues, linear transformations',
        syllabusStructure: [
          { topic: 'Vectors & Matrix Operations', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(55) },
          { topic: 'Systems of Linear Equations', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(47) },
          { topic: 'Determinants', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(33) },
          { topic: 'Vector Spaces', estimatedHours: 10, isCompleted: false },
          { topic: 'Eigenvalues & Eigenvectors', estimatedHours: 12, isCompleted: false },
          { topic: 'Linear Transformations', estimatedHours: 8, isCompleted: false }
        ],
        priorityLevel: 'medium',
        difficultyLevel: 'hard',
        estimatedWeeklyHours: 6,
        progress: 40,
        notes: 'Important for ML courses next semester'
      }
    ]);
    console.log(`✅ Created ${aiSubjects.length} subjects`);

    console.log('⏰ Creating Busy Schedules...');
    const busySchedules = await BusySchedule.create([
      // Classes
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'DS&A Lecture', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', type: 'class', isRecurring: true, isFlexible: false, description: 'Data Structures lecture with Dr. Chen' },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'DS&A Lab', dayOfWeek: 3, startTime: '14:00', endTime: '16:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Database Lecture', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'OS Lecture', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'OS Lab', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Web Dev Lecture', dayOfWeek: 3, startTime: '10:00', endTime: '12:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Linear Algebra', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', type: 'class', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Linear Algebra', dayOfWeek: 4, startTime: '14:00', endTime: '16:00', type: 'class', isRecurring: true, isFlexible: false },
      
      // Part-time work
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Part-time Dev Job', dayOfWeek: 5, startTime: '13:00', endTime: '18:00', type: 'work', isRecurring: true, isFlexible: false, description: 'Remote React developer' },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Part-time Dev Job', dayOfWeek: 6, startTime: '09:00', endTime: '17:00', type: 'work', isRecurring: true, isFlexible: false },
      
      // Personal commitments
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Gym Workout', dayOfWeek: 1, startTime: '06:30', endTime: '07:30', type: 'exercise', isRecurring: true, isFlexible: true },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Gym Workout', dayOfWeek: 3, startTime: '06:30', endTime: '07:30', type: 'exercise', isRecurring: true, isFlexible: true },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Gym Workout', dayOfWeek: 5, startTime: '06:30', endTime: '07:30', type: 'exercise', isRecurring: true, isFlexible: true },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Family Dinner', dayOfWeek: 0, startTime: '18:00', endTime: '20:00', type: 'personal', isRecurring: true, isFlexible: false },
      { userId: alexUser._id, semesterId: fallSemester._id, title: 'Study Group', dayOfWeek: 4, startTime: '16:30', endTime: '18:00', type: 'personal', isRecurring: true, isFlexible: true, description: 'Weekly study group with classmates' }
    ]);
    console.log(`✅ Created ${busySchedules.length} busy schedules`);

    console.log('📝 Creating Deadlines...');
    const deadlines = await Deadline.create([
      // Upcoming deadlines
      {
        userId: alexUser._id,
        subjectId: aiSubjects[0]._id,
        title: 'Graph Algorithms Assignment',
        description: 'Implement BFS, DFS, and Dijkstra\'s algorithm',
        dueDate: new Date('2025-12-20'),
        dueTime: '23:59',
        deadlineType: 'assignment',
        priorityLevel: 'high',
        estimatedHours: 8,
        isCompleted: false,
        status: 'in_progress',
        completionPercentage: 40,
        reminders: [
          { type: '3_days_before', remindAt: new Date('2025-12-17T09:00:00'), sent: false },
          { type: '1_day_before', remindAt: new Date('2025-12-19T09:00:00'), sent: false }
        ]
      },
      {
        userId: alexUser._id,
        subjectId: aiSubjects[1]._id,
        title: 'Database Project - E-commerce System',
        description: 'Design and implement normalized database schema with complex queries',
        dueDate: new Date('2025-12-22'),
        dueTime: '23:59',
        deadlineType: 'project',
        priorityLevel: 'critical',
        estimatedHours: 20,
        isCompleted: false,
        status: 'in_progress',
        completionPercentage: 60,
        reminders: [
          { type: '1_week_before', remindAt: new Date('2025-12-15T09:00:00'), sent: true },
          { type: '3_days_before', remindAt: new Date('2025-12-19T09:00:00'), sent: false }
        ]
      },
      {
        userId: alexUser._id,
        subjectId: aiSubjects[2]._id,
        title: 'OS Final Exam',
        description: 'Comprehensive exam covering all OS topics',
        dueDate: new Date('2025-12-23'),
        dueTime: '14:00',
        deadlineType: 'final',
        priorityLevel: 'critical',
        estimatedHours: 30,
        isCompleted: false,
        status: 'pending',
        reminders: [
          { type: '1_week_before', remindAt: new Date('2025-12-16T09:00:00'), sent: false },
          { type: '3_days_before', remindAt: new Date('2025-12-20T09:00:00'), sent: false },
          { type: '1_day_before', remindAt: new Date('2025-12-22T09:00:00'), sent: false }
        ]
      },
      {
        userId: alexUser._id,
        subjectId: aiSubjects[3]._id,
        title: 'React Portfolio Website',
        description: 'Build a personal portfolio with React and deploy',
        dueDate: new Date('2025-12-18'),
        dueTime: '23:59',
        deadlineType: 'project',
        priorityLevel: 'medium',
        estimatedHours: 15,
        isCompleted: false,
        status: 'in_progress',
        completionPercentage: 75
      },
      {
        userId: alexUser._id,
        subjectId: aiSubjects[4]._id,
        title: 'Linear Algebra Midterm',
        description: 'Midterm exam - Vector spaces and eigenvalues',
        dueDate: new Date('2025-12-19'),
        dueTime: '10:00',
        deadlineType: 'midterm',
        priorityLevel: 'high',
        estimatedHours: 12,
        isCompleted: false,
        status: 'pending'
      },
      // Past completed deadlines
      {
        userId: alexUser._id,
        subjectId: aiSubjects[0]._id,
        title: 'Binary Search Tree Implementation',
        dueDate: getDaysAgo(20),
        dueTime: '23:59',
        deadlineType: 'assignment',
        priorityLevel: 'high',
        isCompleted: true,
        completedAt: getDaysAgo(21),
        status: 'completed',
        completionPercentage: 100,
        grade: 'A',
        score: 95
      }
    ]);
    console.log(`✅ Created ${deadlines.length} deadlines`);

    console.log('🤖 Creating AI Input...');
    const aiInput = await AIInput.create({
      userId: alexUser._id,
      semesterId: fallSemester._id,
      inputType: 'fullContext',
      payload: {
        semesterInfo: {
          name: fallSemester.name,
          startDate: fallSemester.startDate,
          endDate: fallSemester.endDate,
          totalCredits: 18
        },
        subjects: aiSubjects.map(s => ({
          name: s.subjectName,
          credits: s.credits,
          priority: s.priorityLevel,
          difficulty: s.difficultyLevel,
          weeklyHours: s.estimatedWeeklyHours,
          progress: s.progress
        })),
        busySchedule: busySchedules.map(bs => ({
          title: bs.title,
          day: bs.dayOfWeek,
          start: bs.startTime,
          end: bs.endTime,
          type: bs.type,
          flexible: bs.isFlexible
        })),
        preferences: {
          morningStudy: true,
          eveningStudy: true,
          maxSessionsPerDay: 3,
          preferredSessionDuration: 90,
          breakBetweenSessions: 15,
          focusSubjects: ['Data Structures', 'Operating Systems']
        }
      },
      status: 'validated',
      validationResult: {
        isValid: true,
        errors: [],
        warnings: [
          { field: 'totalHours', message: 'High workload detected - 32 hours/week estimated' }
        ]
      }
    });
    console.log('✅ Created AI input');

    console.log('🧠 Creating AI Generation Result...');
    const aiGenerationResult = await AIGenerationResult.create({
      userId: alexUser._id,
      semesterId: fallSemester._id,
      aiInputId: aiInput._id,
      generationPrompt: 'Generate a weekly study timetable for Fall 2025 semester with 5 subjects (DS&A, Database, OS, Web Dev, Linear Algebra). Student has classes Mon-Thu, works Fri-Sat. Max 3 study sessions per day (morning/afternoon/evening). Prioritize DS&A and OS. Balance difficulty and avoid burnout.',
      aiResponse: {
        model: 'gpt-4',
        usage: { prompt_tokens: 2850, completion_tokens: 1240, total_tokens: 4090 }
      },
      promptTokens: 2850,
      completionTokens: 1240,
      totalTokens: 4090,
      model: 'gpt-4',
      temperature: 0.7,
      generationReasoning: 'Created balanced schedule focusing on high-priority subjects (DS&A, OS) while maintaining variety. Morning sessions for difficult subjects when energy is high. Evening sessions for practice and review. Included rest days (Sunday) and lighter study on Friday before work.',
      confidenceScore: 88,
      generatedSchedule: {
        weeklySchedule: [
          {
            weekNumber: 1,
            startDate: new Date('2025-12-15'),
            endDate: new Date('2025-12-21'),
            sessions: [
              // Monday
              { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'morning', subjectId: aiSubjects[0]._id, subjectName: 'DS&A', startTime: '07:00', endTime: '08:30', topic: 'Graph Algorithms - BFS/DFS' },
              { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'evening', subjectId: aiSubjects[2]._id, subjectName: 'OS', startTime: '19:00', endTime: '20:30', topic: 'Memory Management Review' },
              
              // Tuesday
              { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'morning', subjectId: aiSubjects[2]._id, subjectName: 'OS', startTime: '07:00', endTime: '08:30', topic: 'Threads & Concurrency' },
              { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'afternoon', subjectId: aiSubjects[1]._id, subjectName: 'Database', startTime: '12:30', endTime: '14:00', topic: 'Database Project Work' },
              { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'evening', subjectId: aiSubjects[4]._id, subjectName: 'Linear Algebra', startTime: '19:00', endTime: '20:30', topic: 'Eigenvalues Practice' },
              
              // Wednesday
              { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'morning', subjectId: aiSubjects[0]._id, subjectName: 'DS&A', startTime: '07:00', endTime: '08:30', topic: 'Graph Assignment Work' },
              { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'afternoon', subjectId: aiSubjects[3]._id, subjectName: 'Web Dev', startTime: '12:30', endTime: '14:00', topic: 'Portfolio Project - Final touches' },
              { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'evening', subjectId: aiSubjects[1]._id, subjectName: 'Database', startTime: '19:00', endTime: '21:00', topic: 'Database Project Final Push' },
              
              // Thursday
              { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'morning', subjectId: aiSubjects[4]._id, subjectName: 'Linear Algebra', startTime: '07:00', endTime: '08:30', topic: 'Midterm Review' },
              { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'afternoon', subjectId: aiSubjects[2]._id, subjectName: 'OS', startTime: '12:00', endTime: '13:30', topic: 'OS Exam Preparation' },
              { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'evening', subjectId: aiSubjects[0]._id, subjectName: 'DS&A', startTime: '19:00', endTime: '20:30', topic: 'Final Assignment Review' },
              
              // Friday (light day before work)
              { date: new Date('2025-12-20'), dayOfWeek: 5, sessionType: 'morning', subjectId: aiSubjects[2]._id, subjectName: 'OS', startTime: '07:00', endTime: '08:30', topic: 'OS Final Prep' },
              
              // Saturday (work day - evening study only)
              { date: new Date('2025-12-21'), dayOfWeek: 6, sessionType: 'evening', subjectId: aiSubjects[0]._id, subjectName: 'DS&A', startTime: '19:00', endTime: '20:30', topic: 'Light Review' }
            ],
            totalStudyHours: 22.5,
            subjectDistribution: {
              'DS&A': 6,
              'Database': 4.5,
              'OS': 6,
              'Web Dev': 1.5,
              'Linear Algebra': 4.5
            }
          }
        ],
        totalStudyHours: 22.5
      },
      optimizationFactors: {
        spaceRepetition: true,
        difficultyBalance: true,
        deadlineAlignment: true,
        energyLevels: true,
        subjectRotation: true
      },
      status: 'success',
      validationResults: {
        isValid: true,
        maxSessionsPerDayViolated: false,
        timeConflicts: [],
        warnings: ['High study load on Tuesday (4.5 hours)', 'Consider rest breaks']
      },
      wasApplied: true,
      userFeedback: {
        rating: 5,
        helpful: true,
        comments: 'Great schedule! Very balanced and considers my work schedule.',
        issues: [],
        suggestedImprovements: []
      }
    });
    console.log('✅ Created AI generation result');

    console.log('📖 Creating Study Timetable & Sessions...');
    const studyTimetable = await StudyTimetable.create({
      userId: alexUser._id,
      semesterId: fallSemester._id,
      weekStartDate: new Date('2025-12-15'),
      weekEndDate: new Date('2025-12-21'),
      generatedBy: 'AI',
      aiGenerationId: aiGenerationResult._id,
      status: 'active',
      version: 1,
      totalStudyHours: 22.5,
      metadata: {
        totalSessions: 13,
        completedSessions: 2,
        subjectsIncluded: aiSubjects.slice(0, 5).map(s => s._id),
        generationDate: new Date(),
        lastEditedDate: null
      }
    });

    // Create study sessions manually (dates from AI generation might be invalid after save)
    const now = new Date();
    const aiStudySessions = [];
    
    const sessionsToCreate = [
      // WEEK 49 - Monday Dec 9
      { date: new Date('2025-12-09'), dayOfWeek: 1, sessionType: 'morning', subjectId: aiSubjects[0]._id, startTime: '07:00', endTime: '08:30', topic: 'Data Structures Review' },
      { date: new Date('2025-12-09'), dayOfWeek: 1, sessionType: 'afternoon', subjectId: aiSubjects[1]._id, startTime: '14:00', endTime: '15:30', topic: 'SQL Basics' },
      { date: new Date('2025-12-09'), dayOfWeek: 1, sessionType: 'evening', subjectId: aiSubjects[3]._id, startTime: '19:00', endTime: '20:30', topic: 'React Components' },
      // Tuesday Dec 10
      { date: new Date('2025-12-10'), dayOfWeek: 2, sessionType: 'morning', subjectId: aiSubjects[2]._id, startTime: '07:00', endTime: '08:30', topic: 'Process Scheduling' },
      { date: new Date('2025-12-10'), dayOfWeek: 2, sessionType: 'afternoon', subjectId: aiSubjects[4]._id, startTime: '13:00', endTime: '14:30', topic: 'Matrix Operations' },
      { date: new Date('2025-12-10'), dayOfWeek: 2, sessionType: 'evening', subjectId: aiSubjects[0]._id, startTime: '19:00', endTime: '20:30', topic: 'Algorithm Analysis' },
      // Wednesday Dec 11
      { date: new Date('2025-12-11'), dayOfWeek: 3, sessionType: 'morning', subjectId: aiSubjects[1]._id, startTime: '07:00', endTime: '08:30', topic: 'Database Normalization' },
      { date: new Date('2025-12-11'), dayOfWeek: 3, sessionType: 'afternoon', subjectId: aiSubjects[3]._id, startTime: '14:00', endTime: '15:30', topic: 'State Management' },
      { date: new Date('2025-12-11'), dayOfWeek: 3, sessionType: 'evening', subjectId: aiSubjects[2]._id, startTime: '19:00', endTime: '20:30', topic: 'Memory Management' },
      // Thursday Dec 12
      { date: new Date('2025-12-12'), dayOfWeek: 4, sessionType: 'morning', subjectId: aiSubjects[0]._id, startTime: '07:00', endTime: '08:30', topic: 'Sorting Algorithms' },
      { date: new Date('2025-12-12'), dayOfWeek: 4, sessionType: 'afternoon', subjectId: aiSubjects[4]._id, startTime: '13:00', endTime: '14:30', topic: 'Vector Spaces' },
      // Friday Dec 13
      { date: new Date('2025-12-13'), dayOfWeek: 5, sessionType: 'morning', subjectId: aiSubjects[1]._id, startTime: '07:00', endTime: '08:30', topic: 'Advanced SQL' },
      { date: new Date('2025-12-13'), dayOfWeek: 5, sessionType: 'afternoon', subjectId: aiSubjects[3]._id, startTime: '14:00', endTime: '15:30', topic: 'API Integration' },
      // Sunday Dec 14
      { date: new Date('2025-12-14'), dayOfWeek: 0, sessionType: 'morning', subjectId: aiSubjects[4]._id, startTime: '09:00', endTime: '10:30', topic: 'Linear Algebra Review' },
      { date: new Date('2025-12-14'), dayOfWeek: 0, sessionType: 'afternoon', subjectId: aiSubjects[0]._id, startTime: '14:00', endTime: '15:30', topic: 'Algorithm Practice' },
      
      // WEEK 50 - Monday Dec 16
      { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'morning', subjectId: aiSubjects[0]._id, startTime: '07:00', endTime: '08:30', topic: 'Graph Algorithms - BFS/DFS' },
      { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'evening', subjectId: aiSubjects[2]._id, startTime: '19:00', endTime: '20:30', topic: 'Memory Management Review' },
      // Tuesday Dec 17
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'morning', subjectId: aiSubjects[2]._id, startTime: '07:00', endTime: '08:30', topic: 'Threads & Concurrency' },
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'afternoon', subjectId: aiSubjects[1]._id, startTime: '12:30', endTime: '14:00', topic: 'Database Project Work' },
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'evening', subjectId: aiSubjects[4]._id, startTime: '19:00', endTime: '20:30', topic: 'Eigenvalues Practice' },
      // Wednesday Dec 18
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'morning', subjectId: aiSubjects[0]._id, startTime: '07:00', endTime: '08:30', topic: 'Graph Assignment Work' },
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'afternoon', subjectId: aiSubjects[3]._id, startTime: '12:30', endTime: '14:00', topic: 'Portfolio Project - Final touches' },
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'evening', subjectId: aiSubjects[1]._id, startTime: '19:00', endTime: '21:00', topic: 'Database Project Final Push' },
      // Thursday Dec 19
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'morning', subjectId: aiSubjects[4]._id, startTime: '07:00', endTime: '08:30', topic: 'Midterm Review' },
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'afternoon', subjectId: aiSubjects[2]._id, startTime: '12:00', endTime: '13:30', topic: 'OS Exam Preparation' },
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'evening', subjectId: aiSubjects[0]._id, startTime: '19:00', endTime: '20:30', topic: 'Final Assignment Review' },
      // Friday Dec 20
      { date: new Date('2025-12-20'), dayOfWeek: 5, sessionType: 'morning', subjectId: aiSubjects[2]._id, startTime: '07:00', endTime: '08:30', topic: 'OS Final Prep' },
      // Saturday Dec 21
      { date: new Date('2025-12-21'), dayOfWeek: 6, sessionType: 'evening', subjectId: aiSubjects[0]._id, startTime: '19:00', endTime: '20:30', topic: 'Light Review' },
      // Sunday Dec 22
      { date: new Date('2025-12-22'), dayOfWeek: 0, sessionType: 'morning', subjectId: aiSubjects[3]._id, startTime: '09:00', endTime: '10:30', topic: 'Full Stack Project' },
      { date: new Date('2025-12-22'), dayOfWeek: 0, sessionType: 'afternoon', subjectId: aiSubjects[4]._id, startTime: '14:00', endTime: '15:30', topic: 'Math Review' }
    ];
    
    for (const sessionData of sessionsToCreate) {
      const isCompleted = sessionData.date < now;
      
      // Generate realistic completion data for completed sessions
      let completionData = {};
      if (isCompleted) {
        // Parse the scheduled time
        const [startHour, startMinute] = sessionData.startTime.split(':').map(Number);
        const [endHour, endMinute] = sessionData.endTime.split(':').map(Number);
        
        // Create actual start/end times (slight variation from scheduled)
        const actualStart = new Date(sessionData.date);
        actualStart.setHours(startHour, startMinute + Math.floor(Math.random() * 10 - 2), 0, 0); // -2 to +8 minutes variance
        
        // Actual duration varies from 15-50 minutes (realistic study session)
        const actualDurationMinutes = 15 + Math.floor(Math.random() * 36);
        const actualEnd = new Date(actualStart.getTime() + actualDurationMinutes * 60 * 1000);
        
        completionData = {
          actualStartTime: actualStart,
          actualEndTime: actualEnd,
          actualDuration: actualDurationMinutes,
          focusLevel: Math.floor(Math.random() * 3) + 3, // 3-5
          completionNotes: [
            'Học được nhiều thứ',
            'Hoàn thành tốt các mục tiêu',
            'Cần ôn lại một số phần',
            'Rất tập trung và hiệu quả',
            'Đã nắm vững kiến thức cơ bản'
          ][Math.floor(Math.random() * 5)]
        };
      }
      
      const newSession = await StudySessionSchedule.create({
        timetableId: studyTimetable._id,
        userId: alexUser._id,
        subjectId: sessionData.subjectId,
        date: sessionData.date,
        dayOfWeek: sessionData.dayOfWeek,
        sessionType: sessionData.sessionType,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        topic: sessionData.topic,
        plannedDuration: 90,
        isUserEdited: false,
        status: isCompleted ? 'completed' : 'scheduled',
        ...completionData
      });
      
      aiStudySessions.push(newSession);
    }
    console.log(`✅ Created study timetable with ${aiStudySessions.length} sessions`);

    // Link timetable to AI generation result
    aiGenerationResult.timetableId = studyTimetable._id;
    await aiGenerationResult.save();

    console.log('🔔 Creating Reminders...');
    const reminders = await Reminder.create([
      // Study session reminders (upcoming)
      {
        userId: alexUser._id,
        reminderType: 'studySession',
        relatedId: aiStudySessions[2]._id,
        relatedModel: 'StudySessionSchedule',
        title: 'Study Session Starting Soon',
        message: 'Your DS&A study session "Graph Assignment Work" starts in 30 minutes at 07:00',
        remindAt: new Date('2025-12-18T06:30:00'),
        channel: 'email',
        status: 'scheduled',
        recipientEmail: alexUser.email,
        metadata: {
          sessionType: 'morning',
          subject: 'DS&A',
          topic: 'Graph Assignment Work'
        }
      },
      {
        userId: alexUser._id,
        reminderType: 'studySession',
        relatedId: aiStudySessions[5]._id,
        relatedModel: 'StudySessionSchedule',
        title: 'Study Session Starting Soon',
        message: 'Your Linear Algebra study session starts in 30 minutes at 07:00',
        remindAt: new Date('2025-12-19T06:30:00'),
        channel: 'email',
        status: 'scheduled',
        recipientEmail: alexUser.email
      },
      // Deadline reminders
      {
        userId: alexUser._id,
        reminderType: 'deadline',
        relatedId: deadlines[0]._id,
        relatedModel: 'Deadline',
        title: 'Assignment Due in 3 Days',
        message: 'Your Graph Algorithms Assignment is due in 3 days (Dec 20)',
        remindAt: new Date('2025-12-17T09:00:00'),
        channel: 'email',
        status: 'scheduled',
        recipientEmail: alexUser.email
      },
      {
        userId: alexUser._id,
        reminderType: 'deadline',
        relatedId: deadlines[2]._id,
        relatedModel: 'Deadline',
        title: 'Final Exam Tomorrow!',
        message: 'Your OS Final Exam is tomorrow at 14:00. Good luck!',
        remindAt: new Date('2025-12-22T09:00:00'),
        channel: 'email',
        status: 'scheduled',
        recipientEmail: alexUser.email
      },
      // Daily summary
      {
        userId: alexUser._id,
        reminderType: 'dailySummary',
        title: 'Daily Study Plan',
        message: 'Today you have 2 study sessions planned: DS&A (morning) and Database (evening). Total 3 hours.',
        remindAt: new Date('2025-12-17T07:00:00'),
        channel: 'email',
        status: 'scheduled',
        recipientEmail: alexUser.email
      },
      // Past sent reminders
      {
        userId: alexUser._id,
        reminderType: 'studySession',
        relatedId: aiStudySessions[0]._id,
        relatedModel: 'StudySessionSchedule',
        title: 'Study Session Starting Soon',
        message: 'Your DS&A study session starts in 30 minutes',
        remindAt: getDaysAgo(1),
        sentAt: getDaysAgo(1),
        channel: 'email',
        status: 'sent',
        recipientEmail: alexUser.email
      }
    ]);
    console.log(`✅ Created ${reminders.length} reminders`);

    console.log('📧 Creating Notification Logs...');
    const notificationLogs = await NotificationLog.create([
      {
        userId: alexUser._id,
        reminderId: reminders[5]._id,
        notificationType: 'studySession',
        channel: 'email',
        recipient: alexUser.email,
        title: 'Study Session Starting Soon',
        message: 'Your DS&A study session starts in 30 minutes',
        content: 'Your DS&A study session starts in 30 minutes',
        sentAt: getDaysAgo(1),
        status: 'success',
        result: 'delivered',
        deliveryTime: 1.2,
        engagementData: {
          opened: true,
          openedAt: getDaysAgo(1),
          clicked: true,
          clickedAt: getDaysAgo(1),
          clickedLink: '/dashboard/calendar'
        },
        metadata: {
          provider: 'sendgrid',
          messageId: 'msg_123456789'
        }
      },
      {
        userId: alexUser._id,
        reminderId: reminders[5]._id,
        notificationType: 'deadline',
        channel: 'email',
        recipient: alexUser.email,
        title: 'Database Project Due Soon',
        message: 'Your Database Project is due in 1 week',
        content: 'Your Database Project is due in 1 week',
        sentAt: getDaysAgo(8),
        status: 'success',
        result: 'delivered',
        deliveryTime: 0.8,
        engagementData: {
          opened: true,
          openedAt: getDaysAgo(8),
          clicked: false
        },
        metadata: {
          provider: 'sendgrid',
          messageId: 'msg_987654321'
        }
      }
    ]);
    console.log(`✅ Created ${notificationLogs.length} notification logs`);

    // ============================================================
    // TAI USER - STUDY SCHEDULE DATA
    // ============================================================
    
    const taiUser = users.find(u => u.email === 'tai05112004@gmail.com');
    
    console.log('📅 Creating Tai User Semester...');
    const taiSemester = await Semester.create({
      userId: taiUser._id,
      name: 'Fall 2025',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      academicYear: '2025-2026',
      term: 'Fall',
      totalCredits: 20,
      notes: 'Computer Science major - Final semester'
    });
    console.log(`✅ Created semester for Tai`);

    console.log('📚 Creating Tai User Subjects...');
    const taiSubjects = await Subject.create([
      {
        userId: taiUser._id,
        semesterId: taiSemester._id,
        subjectName: 'Advanced Web Development',
        subjectCode: 'CS401',
        credits: 4,
        instructor: 'Prof. Nguyen Van A',
        color: '#FF6B6B',
        syllabus: 'Full-stack development with React, Node.js, and MongoDB',
        syllabusStructure: [
          { topic: 'React Fundamentals', estimatedHours: 10, isCompleted: true, completedAt: getDaysAgo(60) },
          { topic: 'State Management', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(50) },
          { topic: 'Backend APIs', estimatedHours: 12, isCompleted: true, completedAt: getDaysAgo(30) },
          { topic: 'Database Design', estimatedHours: 10, isCompleted: false },
          { topic: 'Authentication & Security', estimatedHours: 8, isCompleted: false },
          { topic: 'Deployment', estimatedHours: 6, isCompleted: false }
        ],
        priorityLevel: 'critical',
        difficultyLevel: 'hard',
        estimatedWeeklyHours: 10,
        progress: 55,
        notes: 'Capstone project course'
      },
      {
        userId: taiUser._id,
        semesterId: taiSemester._id,
        subjectName: 'Machine Learning',
        subjectCode: 'CS402',
        credits: 4,
        instructor: 'Dr. Tran Thi B',
        color: '#4ECDC4',
        syllabus: 'Introduction to ML algorithms, neural networks, and deep learning',
        syllabusStructure: [
          { topic: 'Linear Regression', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(55) },
          { topic: 'Classification Algorithms', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(40) },
          { topic: 'Neural Networks', estimatedHours: 10, isCompleted: false },
          { topic: 'Deep Learning', estimatedHours: 12, isCompleted: false }
        ],
        priorityLevel: 'high',
        difficultyLevel: 'hard',
        estimatedWeeklyHours: 8,
        progress: 40,
        notes: 'Exciting but challenging'
      },
      {
        userId: taiUser._id,
        semesterId: taiSemester._id,
        subjectName: 'Software Engineering',
        subjectCode: 'CS403',
        credits: 3,
        instructor: 'Prof. Le Van C',
        color: '#95E1D3',
        syllabus: 'Software development lifecycle, testing, and project management',
        syllabusStructure: [
          { topic: 'Requirements Analysis', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(50) },
          { topic: 'Design Patterns', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(35) },
          { topic: 'Testing Strategies', estimatedHours: 6, isCompleted: false },
          { topic: 'Agile & DevOps', estimatedHours: 8, isCompleted: false }
        ],
        priorityLevel: 'medium',
        difficultyLevel: 'medium',
        estimatedWeeklyHours: 6,
        progress: 50,
        notes: 'Important for career'
      },
      {
        userId: taiUser._id,
        semesterId: taiSemester._id,
        subjectName: 'Mobile App Development',
        subjectCode: 'CS404',
        credits: 3,
        instructor: 'Dr. Pham Thi D',
        color: '#FFE66D',
        syllabus: 'React Native and mobile development best practices',
        syllabusStructure: [
          { topic: 'React Native Basics', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(45) },
          { topic: 'Navigation & Routing', estimatedHours: 6, isCompleted: false },
          { topic: 'Native Modules', estimatedHours: 8, isCompleted: false },
          { topic: 'App Deployment', estimatedHours: 6, isCompleted: false }
        ],
        priorityLevel: 'medium',
        difficultyLevel: 'medium',
        estimatedWeeklyHours: 6,
        progress: 30,
        notes: 'Building a personal project'
      },
      {
        userId: taiUser._id,
        semesterId: taiSemester._id,
        subjectName: 'Computer Networks',
        subjectCode: 'CS405',
        credits: 3,
        instructor: 'Prof. Hoang Van E',
        color: '#A8E6CF',
        syllabus: 'Network protocols, architecture, and security',
        syllabusStructure: [
          { topic: 'OSI Model', estimatedHours: 6, isCompleted: true, completedAt: getDaysAgo(48) },
          { topic: 'TCP/IP', estimatedHours: 8, isCompleted: true, completedAt: getDaysAgo(30) },
          { topic: 'Routing Protocols', estimatedHours: 8, isCompleted: false },
          { topic: 'Network Security', estimatedHours: 6, isCompleted: false }
        ],
        priorityLevel: 'medium',
        difficultyLevel: 'medium',
        estimatedWeeklyHours: 5,
        progress: 45,
        notes: 'Interesting but lots of theory'
      }
    ]);
    console.log(`✅ Created ${taiSubjects.length} subjects for Tai`);

    console.log('🗓️ Creating Tai User Study Timetable...');
    const taiTimetable = await StudyTimetable.create({
      userId: taiUser._id,
      semesterId: taiSemester._id,
      weekStartDate: new Date('2025-12-15'),
      weekEndDate: new Date('2025-12-21'),
      generatedBy: 'manual',
      status: 'active',
      version: 1,
      totalStudyHours: 35
    });

    // Create Tai's study sessions
    const taiStudySessions = [];
    
    const taiSessionsToCreate = [
      // Monday Dec 16
      { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'morning', subjectId: taiSubjects[0]._id, startTime: '06:30', endTime: '08:00', topic: 'JWT Authentication Implementation' },
      { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'afternoon', subjectId: taiSubjects[1]._id, startTime: '14:00', endTime: '16:00', topic: 'Neural Network & MNIST Training' },
      { date: new Date('2025-12-16'), dayOfWeek: 1, sessionType: 'evening', subjectId: taiSubjects[2]._id, startTime: '19:00', endTime: '21:00', topic: 'Unit Testing with Jest' },
      // Tuesday Dec 17
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'morning', subjectId: taiSubjects[3]._id, startTime: '06:30', endTime: '08:00', topic: 'React Navigation Setup' },
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'afternoon', subjectId: taiSubjects[4]._id, startTime: '14:00', endTime: '15:30', topic: 'RIP and OSPF Routing' },
      { date: new Date('2025-12-17'), dayOfWeek: 2, sessionType: 'evening', subjectId: taiSubjects[0]._id, startTime: '19:00', endTime: '21:30', topic: 'MongoDB Integration' },
      // Wednesday Dec 18
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'morning', subjectId: taiSubjects[1]._id, startTime: '06:30', endTime: '08:30', topic: 'CNN Architecture Study' },
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'afternoon', subjectId: taiSubjects[2]._id, startTime: '14:00', endTime: '16:00', topic: 'Scrum Framework Preparation' },
      { date: new Date('2025-12-18'), dayOfWeek: 3, sessionType: 'evening', subjectId: taiSubjects[3]._id, startTime: '19:00', endTime: '21:00', topic: 'Profile Screen Development' },
      // Thursday Dec 19
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'morning', subjectId: taiSubjects[0]._id, startTime: '06:30', endTime: '08:30', topic: 'UI/UX Enhancement' },
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'afternoon', subjectId: taiSubjects[4]._id, startTime: '14:00', endTime: '15:30', topic: 'Encryption & Firewalls' },
      { date: new Date('2025-12-19'), dayOfWeek: 4, sessionType: 'evening', subjectId: taiSubjects[1]._id, startTime: '19:00', endTime: '21:30', topic: 'Model Training & Optimization' },
      // Friday Dec 20
      { date: new Date('2025-12-20'), dayOfWeek: 5, sessionType: 'morning', subjectId: taiSubjects[2]._id, startTime: '07:00', endTime: '08:30', topic: 'API Documentation' },
      { date: new Date('2025-12-20'), dayOfWeek: 5, sessionType: 'evening', subjectId: taiSubjects[3]._id, startTime: '19:00', endTime: '20:30', topic: 'Feature Testing & Bug Fixes' },
      // Saturday Dec 21
      { date: new Date('2025-12-21'), dayOfWeek: 6, sessionType: 'morning', subjectId: taiSubjects[0]._id, startTime: '09:00', endTime: '11:00', topic: 'Deployment Testing' },
      
      // ===== TUẦN NÀY (Dec 23-29, 2025) =====
      // Monday Dec 23
      { date: new Date('2025-12-23'), dayOfWeek: 1, sessionType: 'morning', subjectId: taiSubjects[0]._id, startTime: '07:00', endTime: '09:00', topic: 'React Optimization' },
      { date: new Date('2025-12-23'), dayOfWeek: 1, sessionType: 'afternoon', subjectId: taiSubjects[1]._id, startTime: '14:00', endTime: '16:30', topic: 'Model Accuracy Analysis' },
      { date: new Date('2025-12-23'), dayOfWeek: 1, sessionType: 'evening', subjectId: taiSubjects[2]._id, startTime: '19:30', endTime: '21:30', topic: 'Code Review Practice' },
      
      // Tuesday Dec 24
      { date: new Date('2025-12-24'), dayOfWeek: 2, sessionType: 'morning', subjectId: taiSubjects[3]._id, startTime: '07:00', endTime: '08:30', topic: 'Backend API Integration' },
      { date: new Date('2025-12-24'), dayOfWeek: 2, sessionType: 'afternoon', subjectId: taiSubjects[4]._id, startTime: '14:30', endTime: '16:00', topic: 'Wireshark Network Analysis' },
      { date: new Date('2025-12-24'), dayOfWeek: 2, sessionType: 'evening', subjectId: taiSubjects[0]._id, startTime: '20:00', endTime: '22:00', topic: 'API Security Implementation' },
      
      // Wednesday Dec 25
      { date: new Date('2025-12-25'), dayOfWeek: 3, sessionType: 'morning', subjectId: taiSubjects[1]._id, startTime: '08:00', endTime: '10:00', topic: 'Transfer Learning Study' },
      { date: new Date('2025-12-25'), dayOfWeek: 3, sessionType: 'afternoon', subjectId: taiSubjects[2]._id, startTime: '15:00', endTime: '17:00', topic: 'CI/CD with GitHub Actions' },
      
      // Thursday Dec 26
      { date: new Date('2025-12-26'), dayOfWeek: 4, sessionType: 'morning', subjectId: taiSubjects[0]._id, startTime: '06:30', endTime: '08:30', topic: 'Production Deployment Preparation' },
      { date: new Date('2025-12-26'), dayOfWeek: 4, sessionType: 'afternoon', subjectId: taiSubjects[3]._id, startTime: '14:00', endTime: '16:00', topic: 'UI Polish & UX Improvement' },
      { date: new Date('2025-12-26'), dayOfWeek: 4, sessionType: 'evening', subjectId: taiSubjects[4]._id, startTime: '19:00', endTime: '21:00', topic: 'Network Security Review' },
      
      // Friday Dec 27
      { date: new Date('2025-12-27'), dayOfWeek: 5, sessionType: 'morning', subjectId: taiSubjects[1]._id, startTime: '07:00', endTime: '09:00', topic: 'ML Project Presentation Prep' },
      { date: new Date('2025-12-27'), dayOfWeek: 5, sessionType: 'afternoon', subjectId: taiSubjects[2]._id, startTime: '14:00', endTime: '15:30', topic: 'Documentation Writing' },
      { date: new Date('2025-12-27'), dayOfWeek: 5, sessionType: 'evening', subjectId: taiSubjects[0]._id, startTime: '19:30', endTime: '21:00', topic: 'End-to-End Testing' },
      
      // Saturday Dec 28
      { date: new Date('2025-12-28'), dayOfWeek: 6, sessionType: 'morning', subjectId: taiSubjects[3]._id, startTime: '09:00', endTime: '11:00', topic: 'App Store Submission' },
      { date: new Date('2025-12-28'), dayOfWeek: 6, sessionType: 'afternoon', subjectId: taiSubjects[1]._id, startTime: '15:00', endTime: '17:00', topic: 'Code Refactoring' },
      
      // Sunday Dec 29
      { date: new Date('2025-12-29'), dayOfWeek: 0, sessionType: 'morning', subjectId: taiSubjects[4]._id, startTime: '09:00', endTime: '11:00', topic: 'Final Exam Review' },
      { date: new Date('2025-12-29'), dayOfWeek: 0, sessionType: 'afternoon', subjectId: taiSubjects[0]._id, startTime: '14:00', endTime: '16:00', topic: 'Portfolio Update' }
    ];
    
    for (const sessionData of taiSessionsToCreate) {
      const isCompleted = sessionData.date < now;
      
      // Generate realistic completion data for completed sessions
      let completionData = {};
      if (isCompleted) {
        // Parse the scheduled time
        const [startHour, startMinute] = sessionData.startTime.split(':').map(Number);
        const [endHour, endMinute] = sessionData.endTime.split(':').map(Number);
        
        // Create actual start/end times (slight variation from scheduled)
        const actualStart = new Date(sessionData.date);
        actualStart.setHours(startHour, startMinute + Math.floor(Math.random() * 10 - 2), 0, 0); // -2 to +8 minutes variance
        
        // Actual duration varies from 20-60 minutes (realistic study session)
        const actualDurationMinutes = 20 + Math.floor(Math.random() * 41);
        const actualEnd = new Date(actualStart.getTime() + actualDurationMinutes * 60 * 1000);
        
        completionData = {
          actualStartTime: actualStart,
          actualEndTime: actualEnd,
          actualDuration: actualDurationMinutes,
          focusLevel: Math.floor(Math.random() * 3) + 3, // 3-5
          completionNotes: [
            'Hoàn thành xuất sắc',
            'Đã hiểu rõ các khái niệm',
            'Cần practice thêm',
            'Session rất productive',
            'Đạt được mục tiêu đề ra'
          ][Math.floor(Math.random() * 5)]
        };
      }
      
      const newSession = await StudySessionSchedule.create({
        timetableId: taiTimetable._id,
        userId: taiUser._id,
        subjectId: sessionData.subjectId,
        date: sessionData.date,
        dayOfWeek: sessionData.dayOfWeek,
        sessionType: sessionData.sessionType,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        topic: sessionData.topic,
        plannedDuration: 90,
        isUserEdited: false,
        status: isCompleted ? 'completed' : 'scheduled',
        ...completionData
      });
      
      taiStudySessions.push(newSession);
    }
    console.log(`✅ Created ${taiStudySessions.length} study sessions for Tai`);

    console.log('\n📊 AI SCHEDULING SYSTEM DATA SUMMARY:');
    console.log(`   Semesters: ${semesters.length + 1} (Alex + Tai)`);
    console.log(`   Subjects: ${aiSubjects.length + taiSubjects.length} (Alex: ${aiSubjects.length}, Tai: ${taiSubjects.length})`);
    console.log(`   Busy Schedules: ${busySchedules.length}`);
    console.log(`   Deadlines: ${deadlines.length}`);
    console.log(`   Study Sessions: ${aiStudySessions.length + taiStudySessions.length} (Alex: ${aiStudySessions.length}, Tai: ${taiStudySessions.length})`);
    console.log(`   Reminders: ${reminders.length}`);
    console.log(`   Notification Logs: ${notificationLogs.length}`);
    console.log(`   AI Inputs: 1`);
    console.log(`   AI Generation Results: 1`);
    console.log(`   Study Timetables: 2 (Alex + Tai)`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the seed function
seedDatabase();
