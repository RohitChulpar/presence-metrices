const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const mongoose = require('mongoose');

// 1. SAVE COMPLETED SESSION + GAMIFICATION + ANOMALY DETECTION
router.post('/save', async (req, res) => {
  try {
    const { userId, startTime, endTime, duration, averageFocus, activityScore } = req.body;
    
    const sessionAlerts = [];
    let riskScore = 0;
    let focusPenalty = 0;

    const minutes = duration / 60;
    // Calculation of interaction ratio to detect "Ghosting" or "Suspicious Speed"
    const interactionRatio = activityScore / (minutes || 1);

    if (averageFocus > 80 && interactionRatio < 150 && duration > 600) {
      sessionAlerts.push("GHOSTING_DETECTED");
      riskScore += 60;
      focusPenalty += 50; 
    }

    if (interactionRatio > 500) {
      sessionAlerts.push("SUSPICIOUS_INPUT_SPEED");
      riskScore += 80;
      focusPenalty += 70; 
    }

    let penalizedFocus = Math.max(0, averageFocus - focusPenalty);

    const newSession = new Session({
      userId,
      startTime,
      endTime,
      duration,
      averageFocus: penalizedFocus,
      totalActivityScore: activityScore || 0,
      alerts: sessionAlerts,
      riskScore: Math.min(riskScore, 100)
    });
    await newSession.save();

    let badgeEarned = false;
    // Logic for awarding deep work badges and maintaining streaks
    if (duration >= 2700 && penalizedFocus >= 90 && sessionAlerts.length === 0) {
      badgeEarned = true;
      await User.findByIdAndUpdate(userId, {
        $inc: { deepWorkBadges: 1, currentStreak: 1 }
      });
    } else if (duration >= 1800) { 
      // Reset streak if session requirements for deep work aren't met
      await User.findByIdAndUpdate(userId, { currentStreak: 0 });
    }

    res.status(201).json({ 
      msg: "Session data saved", 
      deepWorkAwarded: badgeEarned,
      alertsTriggered: sessionAlerts.length,
      finalScore: penalizedFocus
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET HEATMAP AGGREGATION (Refined for Manager View)
router.get('/heatmap/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const employees = await User.find({ managerId }).select('_id');
    const employeeIds = employees.map(emp => emp._id);
    const sessions = await Session.find({ userId: { $in: employeeIds } });
    
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hourNum: i, hour: `${i}:00`, totalFocus: 0, count: 0
    }));

    sessions.forEach(sess => {
      const hour = new Date(sess.startTime).getHours();
      hourlyStats[hour].totalFocus += sess.averageFocus;
      hourlyStats[hour].count += 1;
    });

    const heatmapData = hourlyStats.map(h => ({
      hour: h.hour,
      focus: h.count > 0 ? Math.round(h.totalFocus / h.count) : 0,
      intensity: h.count
    }));

    res.json(heatmapData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET FILTERED SESSIONS
router.get('/manager-view/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const employees = await User.find({ managerId }).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    const sessions = await Session.find({ userId: { $in: employeeIds } })
      .populate('userId', 'username email deepWorkBadges currentStreak')
      .sort({ startTime: -1 });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PERIODIC STATS (TEAM VIEW)
router.get('/stats/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const { period } = req.query;

    const employees = await User.find({ managerId }).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    const days = period === 'monthly' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Session.aggregate([
      { 
        $match: { 
          userId: { $in: employeeIds },
          startTime: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: "$userId",
          totalDuration: { $sum: "$duration" },
          avgFocus: { $avg: "$averageFocus" },
          totalSessions: { $sum: 1 },
          totalAnomalies: { $sum: { $size: { $ifNull: ["$alerts", []] } } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          username: "$userDetails.username",
          totalHours: { $divide: ["$totalDuration", 3600] },
          avgFocus: { $round: ["$avgFocus", 1] },
          totalSessions: 1,
          totalAnomalies: 1
        }
      },
      { $sort: { totalHours: -1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. INDIVIDUAL EMPLOYEE STATS WITH WEEKLY GRAPH DATA
router.get('/individual-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const uId = new mongoose.Types.ObjectId(userId);

    const getPeriodStats = async (days) => {
      const startDate = new Date();
      if (days > 0) startDate.setDate(startDate.getDate() - days);
      else startDate.setHours(0, 0, 0, 0);

      const result = await Session.aggregate([
        { $match: { userId: uId, startTime: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalDuration: { $sum: "$duration" },
            avgFocus:      { $avg: "$averageFocus" },
            anomalies:     { $sum: { $size: { $ifNull: ["$alerts", []] } } },
            sessions:      { $sum: 1 }
          }
        }
      ]);
      return result[0] || { totalDuration: 0, avgFocus: 0, anomalies: 0, sessions: 0 };
    };

    // Calculate boundary for current week without mutating the current date
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfCurrentWeek = new Date(now); 
    startOfCurrentWeek.setDate(now.getDate() - daysFromMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    startOfCurrentWeek.setMilliseconds(0);

    const weeklySessions = await Session.find({
      userId: uId,
      startTime: { $gte: startOfCurrentWeek }
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyDataMap = dayNames.map(day => ({ day, focus: 0, count: 0 }));

    weeklySessions.forEach(s => {
      const dayIdx = new Date(s.startTime).getDay(); 
      const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1; 
      weeklyDataMap[mappedIdx].focus += s.averageFocus;
      weeklyDataMap[mappedIdx].count += 1;
    });

    const finalWeeklyData = weeklyDataMap.map(d => ({
      day: d.day,
      focus: d.count > 0 ? Math.round(d.focus / d.count) : 0
    }));

    // Parallel execution for optimized performance
    const [daily, weekly, monthly] = await Promise.all([
      getPeriodStats(0),
      getPeriodStats(7),
      getPeriodStats(30)
    ]);

    res.json({
      daily:   { hours: (daily.totalDuration   / 3600).toFixed(1), focus: daily.avgFocus.toFixed(1),   anomalies: daily.anomalies,   count: daily.sessions },
      weekly:  { hours: (weekly.totalDuration  / 3600).toFixed(1), focus: weekly.avgFocus.toFixed(1),  anomalies: weekly.anomalies,  count: weekly.sessions },
      monthly: { hours: (monthly.totalDuration / 3600).toFixed(1), focus: monthly.avgFocus.toFixed(1), anomalies: monthly.anomalies, count: monthly.sessions },
      weeklyData: finalWeeklyData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;