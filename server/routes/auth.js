const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- FETCH ALL MANAGERS ---
router.get('/managers', async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' }).select('username _id');
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FETCH TEAM MEMBERS BY MANAGER ---
router.get('/team/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    // Updated to include gamification fields so manager can see badges/streaks
    const team = await User.find({ managerId, role: 'employee' })
      .select('username _id deepWorkBadges currentStreak');
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW: FETCH SINGLE USER STATS ---
// Used by Employee Dashboard to show their Trophies and Streaks
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('deepWorkBadges currentStreak username');
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, managerId } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role,
      managerId: role === 'employee' ? managerId : null 
    });

    await user.save();
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE MANAGER (Transfer Logic) ---
router.post('/update-manager', async (req, res) => {
  try {
    const { userId, newManagerId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.managerId = newManagerId;
    await user.save();

    res.json({ msg: "Manager updated successfully! Your data is now linked to the new supervisor." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;