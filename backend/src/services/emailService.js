const nodemailer = require('nodemailer');

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Template email nhắc nhở học
const getReminderEmailTemplate = (sessionData, actionToken) => {
  const { userName, subjectName, startTime, endTime, date, sessionId } = sessionData;
  
  const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .header h1 {
          color: white;
          margin: 10px 0 0 0;
          font-size: 32px;
          font-weight: 700;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header .icon {
          font-size: 72px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          animation: bounce 2s ease infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .content {
          padding: 40px 35px;
        }
        .session-info {
          background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%);
          border: 2px solid #e0e7ff;
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }
        .session-info h2 {
          color: #1f2937;
          margin: 0 0 20px 0;
          font-size: 22px;
          font-weight: 700;
        }
        .info-row {
          display: flex;
          align-items: center;
          margin: 10px 0;
          font-size: 16px;
        }
        .info-row .label {
          font-weight: 600;
          color: #666;
          min-width: 120px;
        }
        .info-row .value {
          color: #1F1F1F;
          font-weight: 500;
        }
        .message {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
          margin: 20px 0;
        }
        .actions {
          margin: 35px 0 25px 0;
        }
        .action-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          text-align: center;
        }
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .btn {
          display: block;
          padding: 18px 28px;
          text-align: center;
          text-decoration: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        .btn:hover::before {
          width: 300px;
          height: 300px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
          text-decoration: none !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white !important;
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4);
          text-decoration: none !important;
        }
        .btn-danger {
          background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
          color: white !important;
          box-shadow: 0 8px 16px rgba(244, 63, 94, 0.4);
          text-decoration: none !important;
        }
        .footer {
          background: linear-gradient(to right, #f9fafb, #f3f4f6);
          padding: 25px 20px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
        }
        .footer strong {
          color: #6366f1;
          font-weight: 700;
        }
        @media (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .info-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .info-row .label {
            margin-bottom: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">⏰</div>
          <h1>Bạn nhớ lịch học chứ?</h1>
        </div>
        
        <div class="content">
          
          <div class="message" style="background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
            <strong style="font-size: 18px; color: #dc2626;">⏰ Nhắc nhở:</strong> Nhớ là cậu có buổi học trong <strong style="color: #dc2626; font-size: 20px;">15 phút</strong> nữa nhé!
          </div>
          
          <div class="session-info">
            <h2>📚 Thông Tin Buổi Học</h2>
            <div class="info-row">
              <span class="label">📖 Môn học:</span>
              <span class="value">${subjectName}</span>
            </div>
            <div class="info-row">
              <span class="label">📅 Ngày học:</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="label">🕐 Thời gian:</span>
              <span class="value">${startTime} - ${endTime}</span>
            </div>
          </div>
          
          <div class="actions">
            <div class="action-title">Cậu sẽ tham gia chứ?</div>
            <div class="button-group">
              <a href="${apiUrl}/api/session-reminder/confirm/${sessionId}/${actionToken}" class="btn btn-primary" style="color: white !important;">
                ✅ Tham gia
              </a>
              <a href="${baseUrl}/calendar" class="btn btn-secondary" style="color: white !important;">
                📅 Chuyển lịch sang hôm khác
              </a>
              <a href="${apiUrl}/api/session-reminder/skip/${sessionId}/${actionToken}" class="btn btn-danger" style="color: white !important;">
                😢 Nay bận rồi
              </a>
            </div>
          </div>
          
          <div class="message" style="margin-top: 30px; font-size: 14px; color: #888;">
            💡 <em>Nếu bạn chọn "Tham gia", chúng tôi sẽ gửi thông báo nhắc nhở khi buổi học bắt đầu.</em>
          </div>
        </div>
        
        <div class="footer">
          <strong>Stechdy</strong> - Hệ thống quản lý học tập thông minh<br>
          © 2025 All rights reserved | Email được gửi tự động
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template email bắt đầu học
const getStartSessionEmailTemplate = (sessionData) => {
  const { userName, subjectName, startTime, endTime } = sessionData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .header h1 {
          color: white;
          margin: 10px 0 0 0;
          font-size: 32px;
          font-weight: 700;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header .icon {
          font-size: 72px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          animation: bounce 2s ease infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .content {
          padding: 40px 35px;
          text-align: center;
        }
        .message {
          font-size: 18px;
          color: #1f2937;
          line-height: 1.8;
          margin: 20px 0;
          font-weight: 600;
        }
        .message strong {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 22px;
          font-weight: 800;
        }
        .subject-name {
          font-size: 26px;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 25px 0;
        }
        .time-info {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          padding: 25px;
          border-radius: 16px;
          margin: 25px 0;
          border: 2px solid #a7f3d0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }
        .footer {
          background: linear-gradient(to right, #f9fafb, #f3f4f6);
          padding: 25px 20px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
        }
        .footer strong {
          color: #10b981;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🎯</div>
          <h1>Bắt Đầu Học Ngay!</h1>
        </div>
        
        <div class="content">
          <div class="message" style="font-size: 20px; color: #059669;">
            Buổi học bắt đầu rồi! 🚀
          </div>
          
          <div class="subject-name">
            📚 ${subjectName}
          </div>
          
          <div class="time-info">
            <div style="font-size: 18px; color: #059669; font-weight: 700; margin-bottom: 10px;">
              ⏰ Thời gian: ${startTime} - ${endTime}
            </div>
            <div style="font-size: 15px; color: #6b7280;">
              Nhớ học cho hiệu quả nhé 🌟
            </div>
          </div>
        </div>
        
        <div class="footer">
          <strong>Stechdy</strong> - Hệ thống quản lý học tập thông minh<br>
          © 2025 All rights reserved
        </div>
      </div>
    </body>
    </html>
  `;
};

// Gửi email nhắc nhở
const sendReminderEmail = async (userEmail, sessionData, actionToken) => {
  try {
    const mailOptions = {
      from: `"Stechdy Learning" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Nhắc nhở: Buổi học ${sessionData.subjectName} sắp bắt đầu`,
      html: getReminderEmailTemplate(sessionData, actionToken)
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent to ${userEmail} for session ${sessionData.sessionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    return false;
  }
};

// Gửi email bắt đầu học
const sendStartSessionEmail = async (userEmail, sessionData) => {
  try {
    const mailOptions = {
      from: `"Stechdy Learning" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 Bắt đầu học: ${sessionData.subjectName}`,
      html: getStartSessionEmailTemplate(sessionData)
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Start session email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending start session email:', error);
    return false;
  }
};

// Template email chúc mừng hoàn thành buổi học
const getCompletionEmailTemplate = (sessionData) => {
  const { userName, subjectName, actualDuration, startTime, endTime, focusLevel } = sessionData;
  
  const hours = Math.floor(actualDuration / 60);
  const minutes = actualDuration % 60;
  const durationText = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  
  // Focus level emoji
  const focusEmojis = ['😴', '🙂', '😊', '🤩', '🔥'];
  const focusEmoji = focusEmojis[Math.min(focusLevel - 1, 4)] || '😊';
  const focusText = ['Cần cố gắng thêm', 'Khá ổn', 'Tốt', 'Rất tốt', 'Xuất sắc'];
  
  // Motivational messages based on duration
  let motivationMessage = '';
  if (actualDuration >= 120) {
    motivationMessage = 'Bạn là siêu nhân! 💪 Học liên tục hơn 2 tiếng rất ấn tượng!';
  } else if (actualDuration >= 60) {
    motivationMessage = 'Tuyệt vời! 🌟 Bạn đã có một buổi học rất hiệu quả!';
  } else if (actualDuration >= 30) {
    motivationMessage = 'Làm tốt lắm! 👍 Mỗi phút học đều đáng giá!';
  } else {
    motivationMessage = 'Cố gắng duy trì thời gian học dài hơn nhé! 💪';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .header h1 {
          color: white;
          margin: 10px 0 0 0;
          font-size: 32px;
          font-weight: 700;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .header .icon {
          font-size: 72px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          animation: bounce 2s ease infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .content {
          padding: 40px 35px;
          text-align: center;
        }
        .greeting {
          font-size: 20px;
          color: #1f2937;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 25px 20px;
          border-radius: 16px;
          border: 2px solid #bae6fd;
        }
        .stat-card.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #fcd34d;
          grid-column: 1 / -1;
        }
        .stat-icon {
          font-size: 36px;
          margin-bottom: 10px;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .motivation {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #10b981;
          margin: 25px 0;
          text-align: left;
        }
        .motivation p {
          color: #065f46;
          font-size: 16px;
          line-height: 1.6;
        }
        .subject-badge {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 10px 25px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 16px;
          margin: 15px 0;
        }
        .footer {
          background: linear-gradient(to right, #f9fafb, #f3f4f6);
          padding: 25px 20px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
        }
        .footer strong {
          color: #f59e0b;
          font-weight: 700;
        }
        @media (max-width: 500px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🎉</div>
          <h1>Chúc Mừng!</h1>
        </div>
        
        <div class="content">
          <div class="greeting">
            Xin chào <strong>${userName}</strong>! 👋
          </div>
          
          <p style="font-size: 18px; color: #4b5563; margin-bottom: 15px;">
            Bạn đã hoàn thành buổi học thành công!
          </p>
          
          <div class="subject-badge">
            📚 ${subjectName}
          </div>
          
          <div class="stats-grid">
            <div class="stat-card highlight">
              <div class="stat-icon">⏱️</div>
              <div class="stat-label">Thời gian học thực tế</div>
              <div class="stat-value">${durationText}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🕐</div>
              <div class="stat-label">Khung giờ</div>
              <div class="stat-value">${startTime} - ${endTime}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">${focusEmoji}</div>
              <div class="stat-label">Mức độ tập trung</div>
              <div class="stat-value">${focusText[Math.min(focusLevel - 1, 4)] || 'Tốt'}</div>
            </div>
          </div>
          
          <div class="motivation">
            <p>💪 ${motivationMessage}</p>
          </div>
          
          <p style="font-size: 15px; color: #9ca3af; margin-top: 20px;">
            Tiếp tục phát huy nhé! Streak của bạn đang được tính! 🔥
          </p>
        </div>
        
        <div class="footer">
          <strong>Stechdy</strong> - Hệ thống quản lý học tập thông minh<br>
          © 2025 All rights reserved
        </div>
      </div>
    </body>
    </html>
  `;
};

// Gửi email chúc mừng hoàn thành
const sendCompletionEmail = async (userEmail, sessionData) => {
  try {
    const mailOptions = {
      from: `"Stechdy Learning" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Chúc mừng! Bạn đã hoàn thành buổi học ${sessionData.subjectName}`,
      html: getCompletionEmailTemplate(sessionData)
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Completion email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending completion email:', error);
    return false;
  }
};

// Payment notification to admin
const sendPaymentNotificationToAdmin = async (paymentData) => {
  try {
    const { userName, userEmail, planName, amount, paymentCode, paymentId, submittedAt } = paymentData;
    
    const adminEmail = 'stechdy.work@gmail.com';
    const adminPanelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/payments`;
    
    const formattedDate = new Date(submittedAt).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

    const mailOptions = {
      from: `"Stechdy Payment System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `💳 Xác nhận thanh toán mới - ${userName} - ${paymentCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .info-box {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #555;
            }
            .value {
              color: #333;
              font-weight: 500;
            }
            .payment-code {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 20px 0;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .btn:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Xác nhận thanh toán mới</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Có một yêu cầu thanh toán mới cần được xác minh:
              </p>

              <div class="payment-code">
                ${paymentCode}
              </div>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Người dùng:</span>
                  <span class="value">${userName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${userEmail}</span>
                </div>
                <div class="info-row">
                  <span class="label">Gói đăng ký:</span>
                  <span class="value">${planName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Số tiền:</span>
                  <span class="value" style="color: #10b981; font-weight: bold;">${formattedAmount}₫</span>
                </div>
                <div class="info-row">
                  <span class="label">Thời gian xác nhận:</span>
                  <span class="value">${formattedDate}</span>
                </div>
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Lưu ý:</strong> Vui lòng kiểm tra nội dung chuyển khoản có chứa mã <strong>${paymentCode}</strong>
                </p>
              </div>

              <div style="text-align: center;">
                <a href="${adminPanelUrl}" class="btn">
                  🔍 Kiểm tra và xác minh
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
                Thông tin chi tiết chuyển khoản:<br>
                <strong>Tên TK:</strong> TRAN HUU TAI<br>
                <strong>Số TK:</strong> 175678888<br>
                <strong>Ngân hàng:</strong> VIB
              </p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động từ hệ thống Stechdy</p>
              <p>© 2025 Stechdy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment notification sent to admin for ${paymentCode}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending payment notification to admin:', error);
    throw error;
  }
};

// Payment confirmation to user
const sendPaymentConfirmationToUser = async (userData) => {
  try {
    const { userEmail, userName, planName, amount, expiryDate } = userData;
    
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    const formattedExpiry = new Date(expiryDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const mailOptions = {
      from: `"Stechdy Premium" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Thanh toán thành công - Chào mừng bạn đến với Stechdy Premium!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              padding: 40px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .icon {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .success-box {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .info-box {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #555;
            }
            .value {
              color: #333;
              font-weight: 500;
            }
            .features {
              margin: 30px 0;
            }
            .feature-item {
              display: flex;
              align-items: center;
              padding: 10px 0;
              color: #333;
            }
            .feature-item::before {
              content: "✓";
              background: #10b981;
              color: white;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-weight: bold;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🎉</div>
              <h1>Thanh toán thành công!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <p style="margin: 0; color: #065f46; font-weight: 600;">
                  Chúc mừng ${userName}! Thanh toán của bạn đã được xác nhận thành công.
                </p>
              </div>

              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                Bạn đã chính thức trở thành thành viên Premium của Stechdy. Giờ đây bạn có thể tận hưởng tất cả các tính năng cao cấp!
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Gói đăng ký:</span>
                  <span class="value">${planName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Số tiền:</span>
                  <span class="value" style="color: #10b981; font-weight: bold;">${formattedAmount}₫</span>
                </div>
                <div class="info-row">
                  <span class="label">Hiệu lực đến:</span>
                  <span class="value">${formattedExpiry}</span>
                </div>
              </div>

              <h3 style="color: #333; margin-top: 30px;">🌟 Quyền lợi Premium của bạn:</h3>
              <div class="features">
                <div class="feature-item">Phân tích tiến độ nâng cao với AI</div>
                <div class="feature-item">Không giới hạn mục tiêu học tập</div>
                <div class="feature-item">Xuất dữ liệu học tập</div>
                <div class="feature-item">Hỗ trợ email ưu tiên</div>
                <div class="feature-item">Phân tích tâm trạng nâng cao</div>
                <div class="feature-item">Tích hợp lịch thông minh</div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  🚀 Khám phá ngay
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
                Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi!
              </p>
            </div>
            <div class="footer">
              <p>Cảm ơn bạn đã tin tưởng và sử dụng Stechdy!</p>
              <p>© 2025 Stechdy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment confirmation sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending payment confirmation to user:', error);
    throw error;
  }
};

module.exports = {
  sendReminderEmail,
  sendStartSessionEmail,
  sendCompletionEmail,
  sendPaymentNotificationToAdmin,
  sendPaymentConfirmationToUser
};

