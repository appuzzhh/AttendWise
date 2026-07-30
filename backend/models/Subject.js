const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    minAttendance: {
        type: Number,
        default: 75
    },
    goalPercentage: {
        type: Number,
        default: 75,
        min: 1,
        max: 100
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);