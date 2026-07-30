const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

function createToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
}

function userResponse(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        semester: user.semester,
        labBatch: user.labBatch
    };
}

// Register
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            registerNumber,
            semester,
            labBatch
        } = req.body;

        if (!name || !email || !password || !registerNumber) {
            return res.status(400).json({
                message: 'Please fill all required fields'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const userExists = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { registerNumber: registerNumber.trim() }
            ]
        });

        if (userExists) {
            return res.status(400).json({
                message: 'User with this email or register number already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            registerNumber: registerNumber.trim(),
            semester,
            labBatch
        });

        res.status(201).json({
            token: createToken(user._id),
            user: userResponse(user)
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email?.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const passwordCorrect = await bcrypt.compare(
            password || '',
            user.password
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        res.json({
            token: createToken(user._id),
            user: userResponse(user)
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Forgot password
// Demo version: verifies email + register number.
// Production app-ൽ email OTP/token system ഉപയോഗിക്കുക.
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, registerNumber, newPassword } = req.body;

        if (!email || !registerNumber || !newPassword) {
            return res.status(400).json({
                message: 'Enter email, register number and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            registerNumber: registerNumber.trim()
        });

        if (!user) {
            return res.status(400).json({
                message: 'Account details do not match'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            message: 'Password reset successfully. Please log in.'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Could not reset password',
            error: error.message
        });
    }
});

// Get profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({
            message: 'Could not load profile',
            error: error.message
        });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, semester, labBatch } = req.body;

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (name?.trim()) user.name = name.trim();
        if (semester) user.semester = semester;
        if (labBatch !== undefined) user.labBatch = labBatch;

        await user.save();

        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({
            message: 'Could not update profile',
            error: error.message
        });
    }
});

// Change password while logged in
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const passwordCorrect = await bcrypt.compare(
            currentPassword || '',
            user.password
        );

        if (!passwordCorrect) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Could not change password',
            error: error.message
        });
    }
});

module.exports = router;