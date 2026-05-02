const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
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
  role: { 
    type: String, 
    enum: ['employee', 'manager'], 
    default: 'employee' 
  },
  // Links an employee to their specific manager
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  
  // --- NEW GAMIFICATION FIELDS ---
  
  // Total count of 45min+ sessions with >90% focus
  deepWorkBadges: {
    type: Number,
    default: 0
  },
  
  // Tracks consecutive days or sessions of high performance
  currentStreak: {
    type: Number,
    default: 0
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);