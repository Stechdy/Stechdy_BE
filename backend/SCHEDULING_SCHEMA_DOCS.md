# S'Techdy AI Scheduling Database Schema Documentation

## Overview
This document explains the MongoDB database schema for S'Techdy's AI-powered study scheduling system.

## Database Architecture

### Core Collections

#### 1. **Users** (Updated)
Main user authentication and profile management.

**Key Fields:**
- `email`: Unique user identifier
- `timezone`: User's timezone for accurate scheduling (NEW)
- `notificationSettings`: Detailed notification preferences (NEW)
  - `dailyEmail`: Daily study summary
  - `studyReminder`: Session reminders
  - `deadlineReminder`: Deadline alerts
  - `weeklyReport`: Weekly progress reports
  - `aiSuggestions`: AI-generated suggestions

**Indexes:**
- `email` (unique)
- `premiumStatus`
- `isActive`

---

#### 2. **Semesters** (NEW)
Academic period definition for organizing study schedules.

**Key Fields:**
- `userId`: Reference to User
- `name`: e.g., "Fall 2025", "Spring 2026"
- `startDate` & `endDate`: Semester duration
- `isActive`: Whether this is the current active semester
- `totalCredits`: Sum of all subject credits

**Relationships:**
- One User → Many Semesters
- One Semester → Many Subjects
- One Semester → Many BusySchedules
- One Semester → Many StudyTimetables

**Virtual Fields:**
- `durationWeeks`: Calculated semester length in weeks
- `subjects`: Virtual populate of all subjects

**Indexes:**
- `userId` + `startDate`
- `userId` + `isActive`
- `endDate`

---

#### 3. **Subjects** (NEW)
Courses/subjects taken in a semester.

**Key Fields:**
- `userId` & `semesterId`: References
- `subjectName`: Course name
- `syllabus`: Full syllabus text or structured outline
- `syllabusStructure`: Array of topics with completion tracking
- `priorityLevel`: low | medium | high | critical
- `difficultyLevel`: easy | medium | hard | very_hard
- `estimatedWeeklyHours`: Expected study time per week
- `progress`: Auto-calculated from syllabus completion (0-100%)

**Relationships:**
- Many Subjects → One Semester
- One Subject → Many Deadlines
- One Subject → Many StudySessions

**Methods:**
- `updateProgress()`: Recalculates progress based on completed topics

**Indexes:**
- `userId` + `semesterId`
- `semesterId` + `priorityLevel`
- `userId` + `isArchived`

---

#### 4. **BusySchedules** (NEW)
User's unavailable time slots (AI constraint input).

**Key Fields:**
- `userId` & `semesterId`: References
- `title`: Description of busy time
- `dayOfWeek`: 0-6 (Sunday-Saturday)
- `startTime` & `endTime`: HH:MM format
- `type`: class | work | personal | commute | meal | exercise | sleep | other
- `isRecurring`: Whether this repeats weekly
- `isFlexible`: Can AI suggest moving this?

**Important:**
- AI uses these to avoid scheduling study sessions during busy times
- Pre-save validation ensures endTime > startTime

**Methods:**
- `getDurationMinutes()`: Calculate duration
- `conflictsWith(otherSchedule)`: Check time conflicts

**Indexes:**
- `userId` + `semesterId` + `dayOfWeek`
- `semesterId` + `isRecurring`
- `userId` + `type`

---

#### 5. **StudyTimetables** (NEW)
Weekly home-study schedule container.

**Key Fields:**
- `userId` & `semesterId`: References
- `weekStartDate` & `weekEndDate`: Week boundary
- `generatedBy`: AI | manual | template
- `status`: draft | active | edited | archived | completed
- `aiGenerationId`: Link to AIGenerationResult
- `version`: Version number (for edit history)
- `metadata`:
  - `totalSessions`: Count of study sessions
  - `completedSessions`: Completed count
  - `subjectsIncluded`: Array of subject IDs
  - `generationDate`: When AI created this
  - `lastEditedDate`: Last manual edit

**Relationships:**
- One Timetable → Many StudySessionSchedules
- One Timetable → One AIGenerationResult (optional)

**Virtual:**
- `completionPercentage`: Calculated from sessions

**Methods:**
- `calculateTotalHours()`: Sum all session durations
- `archive()`: Mark as archived
- `markAsEdited()`: Track manual edits

**Indexes:**
- `userId` + `semesterId` + `weekStartDate` (desc)
- `userId` + `status`
- `semesterId` + `generatedBy`

---

#### 6. **StudySessionSchedules** (NEW)
Individual study blocks in a timetable.

**Key Fields:**
- `timetableId`: Parent timetable
- `userId` & `subjectId`: References
- `date`: Specific date
- `dayOfWeek`: 0-6
- `sessionType`: morning | afternoon | evening (**MAX 3/day**)
- `startTime` & `endTime`: HH:MM format
- `objectives`: Learning goals array
- `resources`: Array of study resources (textbook, video, article, practice, notes)
- `isUserEdited`: Track manual changes
- `editHistory`: Array of edit logs
- `status`: scheduled | completed | missed
- `actualStartTime` & `actualEndTime`: Actual study time
- `actualDuration`: Actual time spent studying (minutes)
- `focusLevel`: 1-5 (post-session rating by user)
- `completionNotes`: Notes after completing session
- `completedTopics`: Array of topics completed during session
- `isPaused`: Session pause state
- `pausedDuration`: Total paused time (minutes)

**Important Constraint:**
- Pre-save hook validates MAX 3 sessions per day per user

**Methods:**
- `getDurationMinutes()`: Session length
- `complete(focusLevel, notes, completedTopics, actualDuration)`: Mark done
- `reschedule(newDate, newStartTime, newEndTime)`: Move session
- `getComputedStatus()`: Auto-detect missed sessions

**Indexes:**
- `userId` + `date` + `sessionType`
- `timetableId` + `status`
- `subjectId` + `date` (desc)
- `date` + `status`

---

#### 7. **Deadlines** (NEW)
Assignment/exam deadlines attached to subjects.

**Key Fields:**
- `userId` & `subjectId`: References
- `title`: Deadline name
- `dueDate` & `dueTime`: When it's due
- `deadlineType`: assignment | exam | project | quiz | presentation | lab | midterm | final | other
- `priorityLevel`: low | medium | high | critical
- `isCompleted`: Completion status
- `status`: pending | in_progress | completed | overdue | cancelled (auto-updated)
- `reminders`: Array of reminder configs
  - `type`: 1_day_before | 3_days_before | 1_week_before | custom
  - `remindAt`: When to send
  - `sent`: Boolean flag

**Auto-updated:**
- `status` → overdue if past dueDate and not completed
- `completedAt` set when marked complete

**Virtual Fields:**
- `daysUntilDue`: Calculated days remaining
- `isUrgent`: True if ≤3 days and not completed

**Methods:**
- `complete(grade, score)`: Mark as done with grade
- `addReminder(type, customDate)`: Schedule reminder

**Indexes:**
- `userId` + `dueDate`
- `subjectId` + `dueDate`
- `userId` + `status` + `dueDate`
- `userId` + `isCompleted` + `dueDate`
- `dueDate` + `priorityLevel`

---

#### 8. **Reminders** (NEW)
Smart notification engine (email-based).

**Key Fields:**
- `userId`: Reference
- `reminderType`: studySession | deadline | dailySummary | weeklyReport | customEvent
- `relatedId`: Dynamic reference (ObjectId)
- `relatedModel`: StudySessionSchedule | Deadline | BusySchedule | Subject
- `title` & `message`: Notification content
- `remindAt`: When to send (indexed!)
- `channel`: email | push | sms | in_app
- `status`: scheduled | sent | failed | skipped | cancelled
- `recipientEmail`: User's email
- `sentAt`: Delivery timestamp
- `retryCount`: Failed attempts (max 3)

**Methods:**
- `markAsSent()`: Update status and timestamp
- `markAsFailed(reason)`: Log failure
- `scheduleRetry(minutesDelay)`: Retry logic

**Static Methods:**
- `findPending(limit)`: Get reminders ready to send
- `createStudySessionReminder(session, user, advanceMinutes)`: Auto-create
- `createDeadlineReminder(deadline, user, daysBefore)`: Auto-create

**Indexes:**
- `userId` + `remindAt` + `status`
- `remindAt` + `status` (critical for cron jobs)
- `userId` + `reminderType` + `status`
- `relatedId` + `reminderType`

---

#### 9. **NotificationLogs** (NEW)
Tracking sent notifications (audit trail).

**Key Fields:**
- `userId` & `reminderId`: References
- `notificationType`: Type of notification
- `channel`: Delivery method
- `recipient`: Email/phone/device token
- `sentAt`: Delivery time
- `status`: success | failed | bounced | blocked
- `result`: delivered | opened | clicked | failed | bounced | spam
- `engagementData`:
  - `opened`: Boolean
  - `openedAt`: Timestamp
  - `clicked`: Boolean
  - `clickedAt`: Timestamp
  - `clickedLink`: URL

**Methods:**
- `markAsOpened(openedAt)`: Track email opens
- `markAsClicked(link, clickedAt)`: Track link clicks

**Static Methods:**
- `getStats(userId, startDate, endDate)`: Analytics
- `logEmail(...)`: Quick logging helper

**Indexes:**
- `userId` + `sentAt` (desc)
- `reminderId`
- `userId` + `notificationType` + `sentAt`
- `status` + `channel`

---

#### 10. **AIInputs** (NEW)
Data sent to AI for schedule generation.

**Key Fields:**
- `userId` & `semesterId`: References
- `inputType`: syllabus | busySchedule | preferences | constraints | fullContext
- `payload`: JSON data (Mixed type)
- `version`: Input version
- `status`: draft | validated | processed | archived
- `validationResult`:
  - `isValid`: Boolean
  - `errors`: Array of validation errors
  - `warnings`: Array of warnings
- `structuredData`: Parsed/normalized input
  - `subjects`: Array of subject data
  - `busySlots`: Array of busy times
  - `preferences`: Study preferences
  - `constraints`: Scheduling constraints

**Methods:**
- `validate()`: Validate input data
- `structureData()`: Parse and normalize
- `createFromSemester(userId, semesterId)`: Auto-generate from existing data

**Indexes:**
- `userId` + `semesterId` + `createdAt` (desc)
- `semesterId` + `inputType`
- `userId` + `status`

---

#### 11. **AIGenerationResults** (NEW)
AI output storage and tracking.

**Key Fields:**
- `userId`, `semesterId`, `timetableId`: References
- `aiInputId`: Source input
- `generationPrompt`: Prompt sent to AI
- `promptTokens`, `completionTokens`, `totalTokens`: Token usage
- `model`: AI model used (e.g., "gpt-4")
- `temperature`: Generation parameter
- `generationReasoning`: AI's explanation
- `confidenceScore`: 0-100 confidence
- `generatedSchedule`:
  - `weeklySchedule`: Array of weeks with sessions
  - `totalStudyHours`: Sum of all sessions
  - `subjectDistribution`: Hours per subject
- `optimizationFactors`:
  - `spaceRepetition`: Boolean
  - `difficultyBalance`: Boolean
  - `deadlineAlignment`: Boolean
  - `energyLevels`: Boolean
  - `subjectRotation`: Boolean
- `status`: processing | success | failed | partial | cancelled
- `validationResults`: Schedule validation
- `userFeedback`: Rating, comments, issues
- `wasApplied`: Boolean (did user accept?)
- `alternatives`: Alternative schedules

**Virtual:**
- `estimatedCost`: Calculated from tokens

**Methods:**
- `validateSchedule()`: Check constraints (max 3/day, no conflicts)
- `applyToTimetable()`: Create actual timetable & sessions
- `addFeedback(rating, comments, helpful, issues)`: User feedback

**Static Methods:**
- `getGenerationStats(userId, startDate, endDate)`: Analytics

**Indexes:**
- `userId` + `semesterId` + `createdAt` (desc)
- `timetableId`
- `aiInputId`
- `userId` + `status`

---

## Relationships Summary

```
User (1)
├─→ Semesters (N)
│   ├─→ Subjects (N)
│   │   ├─→ Deadlines (N)
│   │   │   └─→ Reminders (N)
│   │   │       └─→ NotificationLogs (N)
│   │   └─→ StudySessionSchedules (N)
│   ├─→ BusySchedules (N)
│   ├─→ StudyTimetables (N)
│   │   └─→ StudySessionSchedules (N)
│   └─→ AIInputs (N)
│       └─→ AIGenerationResults (N)
│           └─→ StudyTimetables (N)
```

---

## AI Timetable Generation Flow

### Step 1: Data Collection
```javascript
// 1. User creates semester, subjects, and busy schedules
const semester = await Semester.create({
  userId,
  name: "Fall 2025",
  startDate: new Date("2025-09-01"),
  endDate: new Date("2025-12-15")
});

// 2. Add subjects
const subjects = await Subject.insertMany([
  {
    userId,
    semesterId: semester._id,
    subjectName: "Mathematics",
    priorityLevel: "high",
    estimatedWeeklyHours: 6
  },
  // ... more subjects
]);

// 3. Add busy schedule
const busySlots = await BusySchedule.insertMany([
  {
    userId,
    semesterId: semester._id,
    title: "CS101 Lecture",
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "11:00",
    type: "class",
    isRecurring: true
  },
  // ... more busy times
]);
```

### Step 2: Create AI Input
```javascript
// Auto-generate input from semester data
const aiInput = await AIInput.createFromSemester(userId, semester._id);

// Validate input
await aiInput.validate();

// Structure data for AI
await aiInput.structureData();
```

### Step 3: Generate Prompt & Call AI
```javascript
const prompt = `
Generate a weekly study timetable with these constraints:
- Subjects: ${aiInput.structuredData.subjects.map(s => s.name).join(', ')}
- Avoid busy times: ${aiInput.structuredData.busySlots.length} slots
- Max 3 sessions per day (morning, afternoon, evening)
- Each session studies ONE subject
- Balance difficulty and priority
- Include spaced repetition
`;

// Call AI API (e.g., OpenAI GPT-4)
const aiResponse = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.7
});

// Store result
const generationResult = await AIGenerationResult.create({
  userId,
  semesterId: semester._id,
  aiInputId: aiInput._id,
  generationPrompt: prompt,
  aiResponse: aiResponse,
  generatedSchedule: parseAIResponse(aiResponse),
  confidenceScore: 85,
  status: "success"
});
```

### Step 4: Validate AI Output
```javascript
// Validate generated schedule
await generationResult.validateSchedule();
// Checks:
// - Max 3 sessions/day
// - No time conflicts with busy schedule
// - All subjects included
// - Balanced distribution
```

### Step 5: Apply to Timetable
```javascript
if (generationResult.validationResults.isValid) {
  // Create StudyTimetable and StudySessionSchedule records
  await generationResult.applyToTimetable();
  // This creates:
  // - 1 StudyTimetable per week
  // - N StudySessionSchedule records (max 21 per week: 7 days × 3 sessions)
}
```

### Step 6: Create Reminders
```javascript
// Auto-create reminders for study sessions
const sessions = await StudySessionSchedule.find({
  userId,
  status: "scheduled"
});

for (const session of sessions) {
  await Reminder.createStudySessionReminder(
    session,
    user,
    30 // remind 30 minutes before
  );
}

// Create deadline reminders
const deadlines = await Deadline.find({ userId, isCompleted: false });
for (const deadline of deadlines) {
  await Reminder.createDeadlineReminder(
    deadline,
    user,
    1 // remind 1 day before
  );
}
```

---

## Manual Editing Support

Users can edit AI-generated schedules:

```javascript
// User edits a session
const session = await StudySessionSchedule.findById(sessionId);

// Track edit
session.editHistory.push({
  editedAt: new Date(),
  field: "startTime",
  oldValue: session.startTime,
  newValue: "15:00"
});

session.startTime = "15:00";
session.isUserEdited = true;
await session.save();

// Update parent timetable
const timetable = await StudyTimetable.findById(session.timetableId);
await timetable.markAsEdited();
```

---

## Indexes Strategy

### High-Priority Indexes (Query Performance)
1. **StudySessionSchedule**: `userId` + `date` + `sessionType` (daily lookup)
2. **Reminder**: `remindAt` + `status` (cron jobs)
3. **Deadline**: `userId` + `dueDate` (dashboard queries)
4. **BusySchedule**: `userId` + `semesterId` + `dayOfWeek` (conflict detection)
5. **StudyTimetable**: `userId` + `semesterId` + `weekStartDate` (week navigation)

### Compound Indexes
- `userId` + other fields for user-specific queries
- `semesterId` + other fields for semester filtering
- `createdAt` descending for recent items
- `status` for filtering active/completed items

---

## Scalability Considerations

### For MVP:
- Single MongoDB instance OK
- Indexes above handle up to 100K users
- AI generation rate-limited per user

### Future Scale:
- **Sharding**: Shard by `userId` (all user data co-located)
- **Read Replicas**: For analytics and reporting
- **Caching**: Redis for active timetables
- **Archive Strategy**: Move old semesters to cold storage after 2 years
- **AI Queue**: Use Bull/Bee for async AI generation

---

## Usage Examples

### Get Current Week's Study Sessions
```javascript
const sessions = await StudySessionSchedule.find({
  userId,
  date: {
    $gte: startOfWeek,
    $lte: endOfWeek
  },
  status: { $in: ['scheduled', 'in_progress'] }
})
.populate('subjectId', 'subjectName color')
.sort({ date: 1, startTime: 1 });
```

### Find Urgent Deadlines
```javascript
const urgentDeadlines = await Deadline.find({
  userId,
  isCompleted: false,
  dueDate: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  }
})
.populate('subjectId', 'subjectName color')
.sort({ dueDate: 1 });
```

### Send Pending Reminders (Cron Job)
```javascript
// Run every minute
const pendingReminders = await Reminder.findPending(100);

for (const reminder of pendingReminders) {
  try {
    // Send email
    await emailService.send({
      to: reminder.recipientEmail,
      subject: reminder.title,
      body: reminder.message
    });
    
    // Log success
    await reminder.markAsSent();
    await NotificationLog.logEmail(
      reminder.userId,
      reminder._id,
      reminder.title,
      reminder.message,
      reminder.recipientEmail,
      'success'
    );
  } catch (error) {
    await reminder.markAsFailed(error.message);
  }
}
```

---

## Notes

- All models use **timestamps** (createdAt, updatedAt)
- ObjectId references for relationships
- Virtuals for computed fields
- Pre-save hooks for validation
- Static methods for common queries
- Instance methods for business logic

