# 📁 Models File Structure

```
backend/src/
├── models/
│   ├── index.js                    # Central export file for all models
│   ├── User.js                     # User authentication and profile
│   ├── Task.js                     # Study planner / task management
│   ├── StudySession.js             # Individual study sessions
│   ├── StudyTracker.js             # Daily study statistics
│   ├── SmartNote.js                # Smart notes with AI features
│   ├── AIStudyBuddy.js             # AI chat conversations
│   ├── MoodTracking.js             # Daily mood entries
│   ├── AIMoodInsight.js            # AI-generated mood insights
│   ├── Gamification.js             # XP, levels, and badges
│   ├── Streak.js                   # Daily activity streaks
│   ├── Settings.js                 # User preferences
│   └── PremiumSubscription.js      # Premium subscription management
└── seed.js                         # Database seeding script

backend/
└── MODELS_README.md                # Complete documentation
```

## 🎯 Quick Import

```javascript
// Import all models at once
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

// Or import individually
const User = require('./models/User');
const Task = require('./models/Task');
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install mongoose bcryptjs
```

### 2. Configure Database
Set your MongoDB connection string:
```javascript
// In your server.js or config file
const MONGODB_URI = 'mongodb://localhost:27017/edtech-productivity';
mongoose.connect(MONGODB_URI);
```

### 3. Seed Database
```bash
node src/seed.js
```

### 4. Use in Controllers
```javascript
const { User, Task } = require('./models');

// Create a task
const task = await Task.create({
  userId: req.user.id,
  title: 'Study for exam',
  dueDate: new Date('2025-12-15'),
  priority: 'high',
  subject: 'Mathematics',
  status: 'todo'
});

// Get user with related data
const user = await User.findById(userId)
  .populate('moodHistory')
  .populate('studyStats');
```

## ✨ Features Included

### Authentication & Authorization
- ✅ Password hashing with bcrypt
- ✅ Email validation
- ✅ Role-based access (user/admin)
- ✅ Premium status checking

### Study Management
- ✅ Task creation with priorities
- ✅ Study session tracking
- ✅ Daily statistics aggregation
- ✅ Subject-based breakdown
- ✅ Focus level tracking

### AI Features
- ✅ Smart note summaries
- ✅ Keyword extraction
- ✅ AI chat buddy conversations
- ✅ Mood insights and recommendations
- ✅ Behavior pattern analysis

### Gamification
- ✅ XP and leveling system
- ✅ Achievement badges
- ✅ Daily streaks
- ✅ Activity tracking
- ✅ Automatic level-up

### User Experience
- ✅ Customizable settings
- ✅ Theme preferences
- ✅ Notification controls
- ✅ Study goals
- ✅ Privacy settings

### Premium Features
- ✅ Subscription management
- ✅ Multiple payment methods
- ✅ Auto-renewal
- ✅ Status tracking
- ✅ Transaction history

## 📊 Seed Data Summary

After running the seed script, you'll have:

- **5 Users** (2 premium, 3 free)
- **20 Tasks** (distributed across users)
- **10 Study Sessions** (realistic durations)
- **Study Trackers** (auto-aggregated)
- **Smart Notes** (with AI summaries)
- **AI Chat Histories** (conversation examples)
- **35 Mood Entries** (7 per user)
- **AI Insights** (mood analysis)
- **Gamification Data** (XP logs, badges)
- **Streak Records** (activity history)
- **User Settings** (preferences)
- **2 Premium Subscriptions** (active)

## 🔗 Model Relationships Diagram

```
                    ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌────▼────┐    ┌─────▼─────┐
    │   TASK    │    │ SESSION │    │   NOTE    │
    └─────┬─────┘    └────┬────┘    └───────────┘
          │               │
          └───────┬───────┘
                  │
           ┌──────▼──────┐
           │   TRACKER   │
           └─────────────┘

    ┌─────────────┐     ┌──────────────┐
    │    MOOD     │────▶│  AI INSIGHT  │
    └─────────────┘     └──────────────┘

    ┌─────────────┐     ┌──────────────┐
    │ GAMIFICATION│     │    STREAK    │
    └─────────────┘     └──────────────┘

    ┌─────────────┐     ┌──────────────┐
    │  SETTINGS   │     │  SUBSCRIPTION│
    └─────────────┘     └──────────────┘
```

## 🧪 Testing Credentials

```
Email: alex.johnson@email.com
Password: password123
Status: Premium User
Level: 5
XP: 450
Streak: 12 days
```

All test users use `password123` for easy testing.

## 📚 Next Steps

1. **Create Controllers** - Implement business logic for each model
2. **Create Routes** - Set up API endpoints
3. **Add Middleware** - Authentication, validation, error handling
4. **Write Tests** - Unit and integration tests
5. **Add API Documentation** - Swagger/OpenAPI specs

## 💡 Pro Tips

- Use `select: false` for sensitive fields
- Always populate relations when needed
- Use indexes for frequently queried fields
- Implement soft deletes for important data
- Add audit logs for critical operations
- Use transactions for related updates
- Cache frequently accessed data
- Implement rate limiting for AI features

## 🐛 Common Issues

### Connection Error
```javascript
// Make sure MongoDB is running
// Check connection string format
// Verify network access
```

### Validation Error
```javascript
// Check required fields
// Verify enum values
// Validate data types
```

### Reference Error
```javascript
// Ensure referenced documents exist
// Use proper ObjectId format
// Check cascade delete behavior
```
