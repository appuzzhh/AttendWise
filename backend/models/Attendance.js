const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
    }
}, { timestamps: true });

// ഒരേ subject-ന് ഒരേ ദിവസം ഒരൊറ്റ attendance record മാത്രം
attendanceSchema.index(
    { subjectId: 1, userId: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);