const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');

// Create subject
router.post('/', protect, async (req, res) => {
    try {
        const { name, minAttendance, goalPercentage } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Subject name is required' });
        }

        const subject = await Subject.create({
            name: name.trim(),
            minAttendance: Number(minAttendance) || 75,
            goalPercentage: Number(goalPercentage) || Number(minAttendance) || 75,
            userId: req.user
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Get all subjects with attendance statistics
router.get('/', protect, async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user });

        const subjectsWithStats = await Promise.all(
            subjects.map(async (subject) => {
                const total = await Attendance.countDocuments({
                    subjectId: subject._id,
                    userId: req.user
                });

                const attended = await Attendance.countDocuments({
                    subjectId: subject._id,
                    userId: req.user,
                    status: 'present'
                });

                return {
                    _id: subject._id,
                    name: subject.name,
                    minAttendance: subject.minAttendance,
                    goalPercentage: subject.goalPercentage || subject.minAttendance,
                    userId: subject.userId,
                    attended,
                    total
                };
            })
        );

        res.json(subjectsWithStats);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Update subject / target goal
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, minAttendance, goalPercentage } = req.body;

        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.userId.toString() !== req.user) {
            return res.status(403).json({
                message: 'Not authorized to edit this subject'
            });
        }

        if (name?.trim()) subject.name = name.trim();
        if (minAttendance) subject.minAttendance = Number(minAttendance);
        if (goalPercentage) subject.goalPercentage = Number(goalPercentage);

        await subject.save();
        res.json(subject);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Delete subject and its attendance history
router.delete('/:id', protect, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.userId.toString() !== req.user) {
            return res.status(403).json({
                message: 'Not authorized to delete this subject'
            });
        }

        await Subject.findByIdAndDelete(req.params.id);

        await Attendance.deleteMany({
            subjectId: req.params.id,
            userId: req.user
        });

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;