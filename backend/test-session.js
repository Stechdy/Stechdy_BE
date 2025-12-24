const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models');

const StudySessionSchedule = require('./src/models/StudySessionSchedule');
const StudyTimetable = require('./src/models/StudyTimetable');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

async function createTestSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Xóa test sessions cũ
    const deleted = await StudySessionSchedule.deleteMany({ 
      topic: 'Test email reminder system'
    });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleted.deletedCount} old test session(s)`);
    }

    const user = await User.findOne({ email: 'tai05112004@gmail.com' });
    if (!user) throw new Error('User not found');

    const subject = await Subject.findOne({ userId: user._id });
    if (!subject) throw new Error('No subject found for user');

    let timetable = await StudyTimetable.findOne({ userId: user._id });
    if (!timetable) {
      console.log('📋 Creating timetable...');
      timetable = await StudyTimetable.create({
        userId: user._id,
        semesterId: subject.semesterId,
        generatedBy: 'manual',
        status: 'active'
      });
    }

    const now = new Date();
    
    // Tạo session cho hôm nay, bắt đầu sau 16 phút
    const sessionStart = new Date(now.getTime() + 16 * 60 * 1000);
    const sessionEnd = new Date(sessionStart.getTime() + 90 * 60 * 1000);

    const h = sessionStart.getHours();
    const m = sessionStart.getMinutes();
    const eh = sessionEnd.getHours();
    const em = sessionEnd.getMinutes();

    const startTime = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
    const endTime = String(eh).padStart(2,'0')+':'+String(em).padStart(2,'0');

    const sessionType = h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : 'evening';

    // Set date to today at midnight
    const sessionDate = new Date(now);
    sessionDate.setHours(0,0,0,0);

    const testSession = await StudySessionSchedule.create({
      timetableId: timetable._id,
      userId: user._id,
      subjectId: subject._id,
      date: sessionDate,
      dayOfWeek: sessionStart.getDay(),
      sessionType: sessionType,
      startTime: startTime,
      endTime: endTime,
      topic: 'Test email reminder system',
      status: 'scheduled',
      plannedDuration: 90
    });

    console.log('\n🎉 TEST SESSION CREATED SUCCESSFULLY!\n');
    console.log('📧 Email will be sent at:', new Date(now.getTime()+15*60*1000).toLocaleTimeString('vi-VN'));
    console.log('🕐 Session starts at:', sessionStart.toLocaleTimeString('vi-VN'));
    console.log('📝 Session ID:', testSession._id);
    console.log('👤 User:', user.email);
    console.log('📚 Subject:', subject.subjectName);
    console.log('⏰ Time:', startTime, '-', endTime);
    console.log('\n🚀 Next step: npm start');
    console.log('⏳ Wait until', new Date(now.getTime()+15*60*1000).toLocaleTimeString('vi-VN'), 'to see email sent\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestSession();
