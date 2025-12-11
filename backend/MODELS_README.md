# EdTech Productivity App - Database Models

Complete Mongoose models for an EdTech Productivity Application with gamification, AI features, and premium subscriptions.

## 📋 Table of Contents

- [Models Overview](#models-overview)
- [Installation](#installation)
- [Database Schema](#database-schema)
- [Running the Seed Script](#running-the-seed-script)
- [Model Relationships](#model-relationships)
- [Usage Examples](#usage-examples)

## 🎯 Models Overview

### Core Models

1. **User** - User accounts with authentication and profile data
2. **Task** - Study planner and task management
3. **StudySession** - Individual study session records
4. **StudyTracker** - Daily aggregated study statistics
5. **SmartNote** - Notes with AI-powered summaries and keywords
6. **AIStudyBuddy** - Conversational AI chat history
7. **MoodTracking** - Daily mood and emotion tracking
8. **AIMoodInsight** - AI-generated mood insights and recommendations
9. **Gamification** - XP, levels, and badges system
10. **Streak** - Daily activity streak tracking
11. **Settings** - User preferences and configurations
12. **PremiumSubscription** - Premium subscription management

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Install Dependencies

```bash
cd backend
npm install mongoose bcryptjs
```

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique, indexed),
  passwordHash: String,
  avatarUrl: String,
  premiumStatus: 'free' | 'premium',
  joinedAt: Date,
  streakCount: Number,
  level: Number,
  xp: Number,
  settings: {
    notification: Boolean,
    sounds: Boolean,
    privacy: 'public' | 'private' | 'friends'
  }
}
```

### Task Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  dueDate: Date,
  priority: 'low' | 'medium' | 'high',
  subject: String,
  status: 'todo' | 'in-progress' | 'done',
  reminder: { enabled: Boolean, time: Date },
  repeatOptions: { enabled: Boolean, frequency: String }
}
```

### StudySession Model
```javascript
{
  userId: ObjectId (ref: User),
  taskId: ObjectId (ref: Task, optional),
  startTime: Date,
  endTime: Date,
  duration: Number (minutes),
  subject: String,
  focusLevel: Number (1-5)
}
```

### StudyTracker Model
```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  totalMinutes: Number,
  sessions: [ObjectId] (ref: StudySession),
  subjectBreakdown: [{ subject: String, minutes: Number }]
}
```

### SmartNote Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  tags: [String],
  linkedTasks: [ObjectId] (ref: Task),
  aiSummary: String,
  aiKeywords: [String],
  isPinned: Boolean,
  color: String
}
```

### MoodTracking Model
```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  mood: Number (1-5),
  emotionTags: [String],
  note: String
}
```

### Gamification Model
```javascript
{
  userId: ObjectId (ref: User),
  currentLevel: Number,
  currentXP: Number,
  requiredXP: Number,
  xpLogs: [{ amount: Number, reason: String, createdAt: Date }],
  totalXPEarned: Number,
  badges: [{ name: String, description: String, earnedAt: Date }]
}
```

### PremiumSubscription Model
```javascript
{
  userId: ObjectId (ref: User),
  plan: 'monthly' | 'yearly',
  status: 'active' | 'expired' | 'cancelled' | 'pending',
  startDate: Date,
  endDate: Date,
  transactionId: String (unique),
  amount: Number,
  currency: String,
  paymentMethod: String,
  autoRenew: Boolean
}
```

## 🌱 Running the Seed Script

### Step 1: Configure Database Connection

Update the MongoDB URI in `src/seed.js`:

```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edtech-productivity';
```

Or set environment variable:
```bash
export MONGODB_URI="mongodb://localhost:27017/edtech-productivity"
```

### Step 2: Run the Seed Script

```bash
node src/seed.js
```

### What Gets Seeded

- **5 Users** with varying premium statuses and experience levels
- **20 Tasks** distributed across users with different priorities and statuses
- **10 Study Sessions** with realistic durations and focus levels
- **Study Trackers** automatically aggregated from sessions
- **Smart Notes** with AI summaries and keywords
- **AI Study Buddy** conversations for each user
- **7 Mood Tracking** entries per user with emotions
- **AI Mood Insights** linked to mood entries
- **Gamification** records with XP logs and badges
- **Streak** records with history
- **Settings** for each user with preferences
- **Premium Subscriptions** for premium users

### Test Credentials

After seeding, you can login with:
- **Email:** alex.johnson@email.com
- **Password:** password123

All users have the same password for testing purposes.

## 🔗 Model Relationships

```
User
  ├── Tasks (1:many)
  ├── StudySessions (1:many)
  ├── StudyTrackers (1:many)
  ├── SmartNotes (1:many)
  ├── AIStudyBuddy (1:1)
  ├── MoodTracking (1:many)
  ├── Gamification (1:1)
  ├── Streak (1:1)
  ├── Settings (1:1)
  └── PremiumSubscription (1:1)

Task
  └── StudySessions (1:many, optional)

MoodTracking
  └── AIMoodInsight (1:1)

StudyTracker
  └── StudySessions (many:many via references)
```

## 💡 Usage Examples

### Import Models

```javascript
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
  PremiumSubscription
} = require('./models');
```

### Create a New Task

```javascript
const task = await Task.create({
  userId: userId,
  title: 'Complete Math Homework',
  description: 'Solve problems 1-20 from chapter 5',
  dueDate: new Date('2025-12-15'),
  priority: 'high',
  subject: 'Mathematics',
  status: 'todo',
  reminder: {
    enabled: true,
    time: new Date('2025-12-14T18:00:00')
  }
});
```

### Log a Study Session

```javascript
const session = await StudySession.create({
  userId: userId,
  taskId: taskId,
  startTime: new Date('2025-12-10T14:00:00'),
  endTime: new Date('2025-12-10T15:30:00'),
  subject: 'Mathematics',
  focusLevel: 4
});
// Duration is automatically calculated
```

### Track Daily Mood

```javascript
const mood = await MoodTracking.create({
  userId: userId,
  date: new Date(),
  mood: 4,
  emotionTags: ['focused', 'motivated', 'energetic'],
  note: 'Had a great study session today!'
});
```

### Add XP to User

```javascript
const gamification = await Gamification.findOne({ userId: userId });
gamification.addXP(50, 'Completed a challenging task');
await gamification.save();
// Level-up is automatically handled
```

### Update Streak

```javascript
const streak = await Streak.findOne({ userId: userId });
streak.updateStreak();
await streak.save();
// Streak logic automatically handled
```

### Query User with Populated Data

```javascript
const user = await User.findById(userId)
  .populate('moodHistory')
  .populate('studyStats');
```

### Get Premium Status

```javascript
const subscription = await PremiumSubscription.findOne({ userId: userId });
if (subscription && subscription.isActive()) {
  console.log('User has active premium subscription');
}
```

## 🔍 Indexes

All models include appropriate indexes for optimal query performance:

- **User**: email, level+xp, premiumStatus
- **Task**: userId+status, userId+dueDate, userId+priority
- **StudySession**: userId+startTime, userId+subject, taskId
- **StudyTracker**: userId+date (unique), userId+date (sorted)
- **MoodTracking**: userId+date, userId+mood
- **Gamification**: userId, currentLevel+currentXP
- **Streak**: userId, currentStreak, longestStreak

## 🛠️ Model Methods

### User Model
- `isPremium()` - Check if user has premium status
- `matchPassword(password)` - Compare password for authentication

### Gamification Model
- `addXP(amount, reason)` - Add XP and handle level-ups automatically

### Streak Model
- `updateStreak()` - Update streak based on last active date

### PremiumSubscription Model
- `isActive()` - Check if subscription is currently active

## 📝 Notes

- All models use timestamps (createdAt, updatedAt)
- Password hashing is handled automatically with bcrypt
- ObjectId references enable efficient joins
- Validation is built into schemas
- Enums ensure data consistency
- Default values reduce boilerplate

## 🔐 Security Considerations

- Passwords are hashed using bcryptjs
- Password field uses `select: false` by default
- Email validation with regex pattern
- Unique constraints on critical fields
- Input length limits to prevent abuse

## 📄 License

MIT

## 👥 Support

For questions or issues, please open an issue on the repository.
