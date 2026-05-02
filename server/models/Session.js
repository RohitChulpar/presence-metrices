const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  duration: { 
    type: Number 
  }, // in seconds
  averageFocus: { 
    type: Number 
  }, // Percentage (e.g., 85)
  status: { 
    type: String, 
    default: 'Completed' 
  },

  // --- NEW COMPLIANCE & ANOMALY FIELDS ---

  // Stores specific types of suspicious behavior detected
  // e.g., ["GHOSTING", "INPUT_INJECTION"]
  alerts: {
    type: [String],
    default: []
  },

  // Numerical value (0-100) to rank how suspicious the session is
  riskScore: {
    type: Number,
    default: 0
  },

  // Total keyboard/mouse interaction count reported from the tracker
  totalActivityScore: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Session', SessionSchema);