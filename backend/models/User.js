const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    registerNumber: {
        type: String,
        required: true,
        unique: true
    },
    semester: {
        type: String,
        required: true
    },
    labBatch: {
        type: String,
        required: true,
        enum: ["Batch 1", "Batch 2"]
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
