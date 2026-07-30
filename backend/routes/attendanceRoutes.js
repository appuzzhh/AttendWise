const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

function startOfDay(value) {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

// Mark attendance
router.post('/', protect, async (req, res) => {
    try {
        const { records, date } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                message: 'records array is required'
            });
        }

        const attendanceDate = startOfDay(date || new Date());

        const results = await Promise.all(
            records.map(({ subjectId, status }) => {
                if (!['present', 'absent'].includes(status)) {
                    throw new Error('Invalid attendance status');
                }

                return Attendance.findOneAndUpdate(
                    {
                        subjectId,
                        userId: req.user,
                        date: attendanceDate
                    },
                    {
                        subjectId,
                        userId: req.user,
                        date: attendanceDate,
                        status
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true
                    }
                );
            })
        );

        res.status(201).json({
            message: 'Attendance saved',
            records: results
        });
    } catch (error) {
        res.status(500).json({
            message: 'Could not save attendance',
            error: error.message
        });
    }
});

// Today's attendance
router.get('/today', protect, async (req, res) => {
    try {
        const today = startOfDay(new Date());
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const records = await Attendance.find({
            userId: req.user,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({
            message: 'Could not load today attendance',
            error: error.message
        });
    }
});

// History filters:
// /api/attendance/history?start=2026-01-01&end=2026-01-31&subjectId=...
router.get('/history', protect, async (req, res) => {
    try {
        const query = { userId: req.user };

        if (req.query.subjectId) {
            query.subjectId = req.query.subjectId;
        }

        if (req.query.start || req.query.end) {
            query.date = {};

            if (req.query.start) {
                query.date.$gte = startOfDay(req.query.start);
            }

            if (req.query.end) {
                const endDate = startOfDay(req.query.end);
                endDate.setUTCDate(endDate.getUTCDate() + 1);
                query.date.$lt = endDate;
            }
        }

        const records = await Attendance.find(query)
            .populate('subjectId', 'name minAttendance goalPercentage')
            .sort({ date: -1, createdAt: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({
            message: 'Could not load attendance history',
            error: error.message
        });
    }
});

// Analytics API: subject chart + attendance trend
router.get('/analytics', protect, async (req, res) => {
    try {
        const [subjects, records] = await Promise.all([
            Subject.find({ userId: req.user }).sort({ name: 1 }),
            Attendance.find({ userId: req.user })
                .sort({ date: 1 })
                .populate('subjectId', 'name')
        ]);

        const comparison = subjects.map((subject) => {
            const subjectRecords = records.filter(
                (record) =>
                    record.subjectId?._id.toString() ===
                    subject._id.toString()
            );

            const attended = subjectRecords.filter(
                (record) => record.status === 'present'
            ).length;

            const total = subjectRecords.length;

            return {
                subjectId: subject._id,
                name: subject.name,
                attended,
                total,
                percentage: total
                    ? Math.round((attended * 100) / total)
                    : 0,
                goalPercentage:
                    subject.goalPercentage ||
                    subject.minAttendance ||
                    75
            };
        });

        const dailyMap = new Map();

        records.forEach((record) => {
            const date = record.date.toISOString().slice(0, 10);

            const current = dailyMap.get(date) || {
                date,
                attended: 0,
                total: 0
            };

            current.total += 1;

            if (record.status === 'present') {
                current.attended += 1;
            }

            dailyMap.set(date, current);
        });

        const trend = [...dailyMap.values()].map((day) => ({
            ...day,
            percentage: Math.round((day.attended * 100) / day.total)
        }));

        res.json({ comparison, trend });
    } catch (error) {
        res.status(500).json({
            message: 'Could not load analytics',
            error: error.message
        });
    }
});

// Weekly / monthly / semester report
router.get('/report', protect, async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const end = new Date();
        const start = new Date(end);

        if (period === 'week') {
            start.setDate(end.getDate() - 6);
        } else if (period === 'semester') {
            start.setMonth(end.getMonth() - 6);
        } else {
            start.setMonth(end.getMonth() - 1);
        }

        start.setUTCHours(0, 0, 0, 0);

        const records = await Attendance.find({
            userId: req.user,
            date: {
                $gte: start,
                $lte: end
            }
        }).populate('subjectId', 'name minAttendance goalPercentage');

        const groups = {};

        records.forEach((record) => {
            if (!record.subjectId) return;

            const id = record.subjectId._id.toString();

            if (!groups[id]) {
                groups[id] = {
                    subjectId: id,
                    name: record.subjectId.name,
                    attended: 0,
                    total: 0,
                    goalPercentage:
                        record.subjectId.goalPercentage ||
                        record.subjectId.minAttendance ||
                        75
                };
            }

            groups[id].total += 1;

            if (record.status === 'present') {
                groups[id].attended += 1;
            }
        });

        const subjects = Object.values(groups).map((item) => ({
            ...item,
            percentage: item.total
                ? Math.round((item.attended * 100) / item.total)
                : 0
        }));

        const totals = subjects.reduce(
            (sum, item) => ({
                attended: sum.attended + item.attended,
                total: sum.total + item.total
            }),
            { attended: 0, total: 0 }
        );

        res.json({
            period,
            start,
            end,
            subjects,
            attended: totals.attended,
            total: totals.total,
            overallPercentage: totals.total
                ? Math.round((totals.attended * 100) / totals.total)
                : 0
        });
    } catch (error) {
        res.status(500).json({
            message: 'Could not create report',
            error: error.message
        });
    }
});

module.exports = router;