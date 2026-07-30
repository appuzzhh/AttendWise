const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');

// Default periods (used only the very first time a user opens Timetable)
const DEFAULT_PERIODS = [
    { label: 'Period 1', startTime: '09:00', endTime: '09:50', type: 'class' },
    { label: 'Period 2', startTime: '09:50', endTime: '10:40', type: 'class' },
    { label: 'Break', startTime: '10:40', endTime: '10:50', type: 'break' },
    { label: 'Period 3', startTime: '10:50', endTime: '11:40', type: 'class' },
    { label: 'Period 4', startTime: '11:40', endTime: '12:30', type: 'class' },
    { label: 'Lunch Break', startTime: '12:30', endTime: '13:15', type: 'lunch' },
    { label: 'Period 5', startTime: '13:15', endTime: '14:05', type: 'class' },
    { label: 'Period 6', startTime: '14:05', endTime: '14:55', type: 'class' },
    { label: 'Break', startTime: '14:55', endTime: '15:05', type: 'break' },
    { label: 'Period 7', startTime: '15:05', endTime: '16:00', type: 'class' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function buildEmptySchedule(periodsLength) {
    const schedule = {};
    DAYS.forEach(day => {
        schedule[day] = {
            slots: Array.from({ length: periodsLength }, (_, i) => ({
                periodIndex: i,
                kind: 'none',
                subjectName: '',
                options: [],
            }))
        };
    });
    return schedule;
}

// GET /api/timetable - get the logged-in user's timetable (create a blank default if none exists)
router.get('/', protect, async (req, res) => {
    try {
        let timetable = await Timetable.findOne({ userId: req.user });

        if (!timetable) {
            timetable = await Timetable.create({
                userId: req.user,
                periods: DEFAULT_PERIODS,
                schedule: buildEmptySchedule(DEFAULT_PERIODS.length),
            });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT /api/timetable - replace the logged-in user's entire timetable (periods + schedule)
router.put('/', protect, async (req, res) => {
    try {
        const { periods, schedule } = req.body;

        if (!periods || !schedule) {
            return res.status(400).json({ message: 'periods and schedule are required' });
        }

        let timetable = await Timetable.findOne({ userId: req.user });

        if (!timetable) {
            timetable = new Timetable({ userId: req.user });
        }

        timetable.periods = periods;
        timetable.schedule = schedule;

        await timetable.save();
        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;