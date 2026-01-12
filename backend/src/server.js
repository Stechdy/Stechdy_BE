const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");

// Load env vars FIRST - includes TZ=Asia/Ho_Chi_Minh
dotenv.config();

const connectDB = require("./config/database");
const { initializeScheduler } = require("./utils/scheduler");
const { startReminderScheduler } = require("./services/sessionReminderService");
const { initializeSocket } = require("./services/socketService");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize scheduler for notifications
initializeScheduler();

// Start session reminder scheduler
startReminderScheduler();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/study-sessions", require("./routes/studySessionRoutes"));
app.use("/api/moods", require("./routes/moodRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/session-reminder", require("./routes/sessionReminderRoutes"));
app.use("/api/deadlines", require("./routes/deadlineRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Welcome route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to S-Techdy API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Initialize Socket.IO after server starts
  initializeSocket(server);
});
