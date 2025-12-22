# 🔔 Advanced Notification System

## ✨ Overview

Hệ thống notification nâng cao với AI mood analysis, tự động phân tích cảm xúc người dùng để tạo thông báo cá nhân hóa và thân thiện.

## 🎯 Features

- ✅ **Mood-Based Personalization** - 3 mức độ: Gentle, Normal, Energetic
- 📚 **Study Session Reminders** - Nhắc trước 30 phút
- ✅ **Task Reminders** - Kiểm tra mỗi giờ cho tasks due trong 24h
- ⏰ **Deadline Reminders** - 3 tiers: 7 ngày, 3 ngày, 24 giờ
- 🏆 **Achievement Notifications** - Level up, streaks, milestones
- 📧 **Email Integration** - Beautiful HTML emails
- 🧠 **AI Mood Analysis** - Phân tích patterns & recommendations

## 📂 Structure

```
backend/src/
├── services/
│   ├── moodAnalysisService.js          # AI mood analysis
│   ├── personalizedMessageService.js   # Generate personalized messages
│   └── notificationService.js          # Send notifications & emails
├── controllers/
│   └── notificationController.js       # API controllers
├── routes/
│   └── notificationRoutes.js           # API routes
├── utils/
│   └── scheduler.js                    # Cron jobs
└── examples/
    └── notificationExamples.js         # Usage examples
```

## 🚀 Quick Start

### 1. Environment Variables

Add to `.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 2. Start Server

```bash
npm run dev
```

Logs sẽ hiển thị:
```
✅ Scheduler initialized successfully!
📅 Scheduled Tasks:
  🌅 Morning mood reminders: 9:00 AM daily
  🌙 Evening mood reminders: 7:00 PM daily
  ✅ Task reminders: Every hour
  📚 Study session reminders: Every 15 minutes
  ⏰ Deadline reminders: 8:00 AM & 6:00 PM daily
```

### 3. Test API

```bash
# Get mood analysis
GET /api/notifications/mood-analysis

# Test task reminder
POST /api/notifications/test-task-reminder

# Create achievement
POST /api/notifications/achievement
Body: { "achievementType": "level_up", "data": { "newLevel": 5 } }
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user's notifications |
| GET | `/api/notifications/mood-analysis` | Get mood analysis |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |
| POST | `/api/notifications/achievement` | Create achievement |
| POST | `/api/notifications/test-*` | Test endpoints |

## 🎨 Message Examples

### Task - High Priority

**Gentle Mode (Khi user stress cao):**
```
💙 Xin chào! Có một task quan trọng cần chú ý. 
Hãy làm từ từ, không cần vội vàng nhé!
```

**Energetic Mode (Khi user năng lượng cao):**
```
🚀 Chào người chiến binh! Task quan trọng 
đang chờ bạn chinh phục!
```

### Study Session

**Gentle:**
```
💙 30 phút nữa là đến giờ học Toán. 
Hãy chuẩn bị tinh thần nhẹ nhàng nhé!
```

**Energetic:**
```
🚀 Còn 30 phút nữa! Sẵn sàng chinh phục Toán chưa?
```

### Deadline - Urgent

**Gentle:**
```
💙 Deadline Báo cáo còn 6 giờ. 
Hãy làm từ từ, bạn sẽ kịp thời gian!
```

**Energetic:**
```
🚨 Go go go! Báo cáo còn 6 giờ là deadline! 
Let's finish this!
```

## 🧠 Mood Analysis

### `analyzeMoodTrend(userId, days)`
Phân tích xu hướng mood trong N ngày:
```javascript
{
  trend: 'improving',       // improving | declining | stable
  avgMoodLevel: 4.2,        // 1-5
  avgStressLevel: 2.5,      // 1-5
  avgEnergyLevel: 4.5,      // 1-5
  consistency: 'high'       // high | medium | low
}
```

### `getCurrentEmotionalState(userId)`
Trạng thái cảm xúc hiện tại:
```javascript
{
  hasCheckedInToday: true,
  todayMood: 'happy',
  weekTrend: 'improving',
  avgMoodLevel: 4.2
}
```

### `analyzeBestStudyTime(userId)`
Thời gian học tốt nhất:
```javascript
{
  recommendation: 'morning', // morning | afternoon | evening
  avgEnergy: 4.5,
  confidence: 'high'
}
```

## ⚙️ Scheduler Configuration

```javascript
'0 9 * * *'       → Mood reminder (morning) - 9 AM
'0 19 * * *'      → Mood reminder (evening) - 7 PM
'0 * * * *'       → Task reminders - Every hour
'*/15 * * * *'    → Study sessions - Every 15 mins
'0 8,18 * * *'    → Deadlines - 8 AM & 6 PM
```

## 📧 Email Templates

3 beautiful email templates:
- **Task Reminder** - Purple gradient
- **Study Session** - Pink gradient
- **Deadline** - Red gradient

All với responsive design, CTA buttons, và mobile-friendly!

## 🔐 Security

- JWT authentication required
- User-specific notifications
- Settings-based opt-in/out
- Rate limiting ready
- Auto-expire old notifications

## 📚 Documentation

- **ADVANCED_NOTIFICATION_SYSTEM.md** - Full documentation
- **NOTIFICATION_QUICK_START.md** - Quick start guide
- **NOTIFICATION_SUMMARY.md** - Summary
- **examples/notificationExamples.js** - Code examples

## 🎯 User Settings

Users control notifications via:
```javascript
notificationSettings: {
  dailyEmail: true,         // Email notifications
  studyReminder: true,      // Study & task reminders
  deadlineReminder: true,   // Deadline alerts
  weeklyReport: false       // Weekly summary
}
```

## 💡 Usage Examples

```javascript
// Get mood analysis
const { analyzeMoodTrend } = require('./services/moodAnalysisService');
const analysis = await analyzeMoodTrend(userId, 7);

// Generate personalized message
const { generateTaskReminderMessage } = require('./services/personalizedMessageService');
const { title, message } = await generateTaskReminderMessage(task, user);

// Create achievement
const { createAchievementNotification } = require('./services/notificationService');
await createAchievementNotification(userId, 'level_up', { newLevel: 5 });
```

## 🐛 Troubleshooting

### Email không gửi:
- Check EMAIL_USER và EMAIL_PASSWORD trong .env
- Đảm bảo đã tạo App Password từ Google
- Test transporter connection

### Notifications không hiện:
- Check user settings: `notificationSettings.studyReminder = true`
- Verify scheduler đang chạy (xem logs)
- Check timezone: `Asia/Ho_Chi_Minh`

### Mood analysis không chính xác:
- Cần ít nhất 3-7 mood entries
- Check data quality

## 📈 Metrics

Track these metrics:
- Delivery rate
- Open/read rate
- Click rate
- Unsubscribe rate
- Response time

## 🎉 Benefits

### Cho Users:
- 🎯 Thông báo phù hợp tâm trạng
- 💙 Giảm stress với gentle messages
- ⚡ Tăng động lực với energetic messages
- 📚 Không bỏ lỡ deadlines

### Cho System:
- 🧠 AI-powered personalization
- 📊 Data-driven decisions
- ⚙️ Fully automated
- 🔄 Scalable architecture

## 📝 To-Do

- [ ] Push notifications (mobile)
- [ ] SMS reminders
- [ ] A/B testing messages
- [ ] Machine learning predictions
- [ ] Voice notifications

## 🤝 Contributing

See examples in `examples/notificationExamples.js`

## 📄 License

MIT

---

**Ready to use! 🚀**

Start server và enjoy personalized notifications!
