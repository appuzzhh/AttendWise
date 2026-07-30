const mongoose = require('mongoose');

// A single slot within a day's schedule
const SlotSchema = new mongoose.Schema({
    periodIndex: { type: Number, required: true }, // which period (matches index in periods array)
    kind: {
        type: String,
        enum: ['subject', 'choice', 'none'], // 'none' = free/no class (used for break/lunch rows too)
        default: 'none'
    },
    subjectName: { type: String, default: '' }, // used when kind = 'subject'
    options: [{ type: String }], // used when kind = 'choice', e.g. ["Computer Networks Lab", "Machine Learning Lab"]
}, { _id: false });

const PeriodSchema = new mongoose.Schema({
    label: { type: String, required: true },      // e.g. "Period 1", "Break", "Lunch Break"
    startTime: { type: String, required: true },  // e.g. "09:00"
    endTime: { type: String, required: true },    // e.g. "09:50"
    type: {
        type: String,
        enum: ['class', 'break', 'lunch'],
        default: 'class'
    }
}, { _id: false });

const DayScheduleSchema = new mongoose.Schema({
    slots: [SlotSchema]
}, { _id: false });

const TimetableSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    periods: [PeriodSchema],
    schedule: {
        monday: DayScheduleSchema,
        tuesday: DayScheduleSchema,
        wednesday: DayScheduleSchema,
        thursday: DayScheduleSchema,
        friday: DayScheduleSchema,
        saturday: DayScheduleSchema,
        sunday: DayScheduleSchema,
    }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);