const express = require('express');
const router = express.Router();
const StudySessionSchedule = require('../models/StudySessionSchedule');
const { handleConfirm, handleSkip, verifyActionToken } = require('../services/sessionReminderService');

// Xử lý confirm tham gia
router.get('/confirm/:sessionId/:token', async (req, res) => {
  try {
    const { sessionId, token } = req.params;
    
    const session = await StudySessionSchedule.findById(sessionId).populate('userId subjectId');
    
    if (!session) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            .error { color: #EF4444; font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <h2>Session không tồn tại</h2>
            <p>Buổi học không được tìm thấy hoặc đã bị xóa.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Verify token
    const isValid = verifyActionToken(sessionId, session.userId._id.toString(), token);
    
    if (!isValid) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            .error { color: #EF4444; font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">🔒</div>
            <h2>Token không hợp lệ</h2>
            <p>Link xác nhận không hợp lệ hoặc đã hết hạn.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Đánh dấu đã confirm và bắt đầu tính giờ học
    handleConfirm(sessionId);
    
    // Cập nhật actualStartTime vào database
    await StudySessionSchedule.findByIdAndUpdate(sessionId, {
      actualStartTime: new Date(),
      confirmedAt: new Date()
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(function() {
            window.location.href = '${frontendUrl}';
          }, 5000);
        </script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 60px 50px;
            border-radius: 24px;
            max-width: 550px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .success-icon {
            font-size: 100px;
            margin-bottom: 25px;
            animation: bounce 1s ease infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          h2 {
            color: #10b981;
            margin: 0 0 20px 0;
            font-size: 32px;
            font-weight: 700;
          }
          p {
            color: #4b5563;
            line-height: 1.8;
            font-size: 17px;
            margin: 20px 0;
          }
          .session-info {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            padding: 25px;
            border-radius: 16px;
            margin: 25px 0;
            border: 2px solid #a7f3d0;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
          }
          .info-row {
            margin: 12px 0;
            color: #1f2937;
            font-size: 16px;
          }
          .label {
            font-weight: 700;
            color: #059669;
          }
        </style>
      </head>
      <body>
            color: #b45309;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h2>Xác nhận tham gia 🎉</h2>
          <p>Xác nhận rồi thì nhớ tham gia đúng giờ he 😊</p>
          <div class="session-info">
            <div class="info-row">
              <span class="label">📚 Môn học:</span> ${session.subjectId?.subjectName || 'N/A'}
            </div>
            <div class="info-row">
              <span class="label">🕐 Thời gian:</span> ${session.startTime} - ${session.endTime}
            </div>
          </div>
          <p style="font-size: 15px; color: #6b7280;">
            Tôi sẽ nhắc bạn khi buổi học bắt đầu. 🚀
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error confirming session:', error);
    res.status(500).send('Internal server error');
  }
});

// Xử lý skip/bỏ qua
router.get('/skip/:sessionId/:token', async (req, res) => {
  try {
    const { sessionId, token } = req.params;
    
    const session = await StudySessionSchedule.findById(sessionId).populate('userId subjectId');
    
    if (!session) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            .error { color: #EF4444; font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <h2>Session không tồn tại</h2>
          </div>
        </body>
        </html>
      `);
    }

    // Verify token
    const isValid = verifyActionToken(sessionId, session.userId._id.toString(), token);
    
    if (!isValid) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            .error { color: #EF4444; font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">🔒</div>
            <h2>Token không hợp lệ</h2>
          </div>
        </body>
        </html>
      `);
    }

    // Đánh dấu missed
    await handleSkip(sessionId);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(function() {
            window.location.href = '${frontendUrl}';
          }, 7000);
        </script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 60px 50px;
            border-radius: 24px;
            max-width: 550px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .warning-icon {
            font-size: 100px;
            margin-bottom: 25px;
          }
          h2 {
            color: #6b7280;
            margin: 0 0 20px 0;
            font-size: 32px;
            font-weight: 700;
          }
          p {
            color: #4b5563;
            line-height: 1.8;
            font-size: 17px;
            margin: 20px 0;
          }
          .session-info {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 25px;
            border-radius: 16px;
            margin: 25px 0;
            border: 2px solid #d1d5db;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .info-row {
            margin: 12px 0;
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="warning-icon">📝</div>
          <h2>Ê tớ buồn à nha 🥲</h2>
          <p>Nhớ hoàn thành vào lần sau nhé!!!</p>
          <div class="session-info">
            <div class="info-row">
              📚 ${session.subjectId?.subjectName || 'N/A'}
            </div>
            <div class="info-row">
              🕐 ${session.startTime} - ${session.endTime}
            </div>
          </div>
          <p style="font-size: 15px; color: #6b7280;">
            Bạn có thể sắp xếp lại lịch học từ trang Calendar. 📅
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error skipping session:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
