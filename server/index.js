const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// ✅ FORCE ENV PATH (WORKS IN EXE + DEV)
const envPath = path.join(__dirname, '.env');

console.log("🔍 Loading .env from:", envPath);

if (fs.existsSync(envPath)) {
require('dotenv').config({ path: envPath });
console.log("✅ ENV loaded correctly");
} else {
console.error("❌ .env NOT FOUND at:", envPath);
}

console.log("📌 MONGODB_URI:", process.env.MONGODB_URI ? "FOUND" : "MISSING");

// ----------------------------

const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
cors: {
origin: "*",
methods: ["GET", "POST"]
}
});

// ROUTES
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

// MIDDLEWARE
app.use(cors({
origin: "*",
methods: ["GET", "POST", "PUT", "DELETE"],
allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Attach socket
app.use((req, res, next) => {
req.io = io;
next();
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// SOCKET EVENTS
io.on('connection', (socket) => {
console.log('⚡ User Connected:', socket.id);

socket.on('update_status', (data) => {
io.emit('status_changed', data);
});

socket.on('disconnect', () => {
console.log('❌ User Disconnected');
});
});

// MONGODB
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
console.error("❌ ERROR: MONGODB_URI is missing!");
process.exit(1);
}

mongoose.connect(mongoURI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
console.log(`🚀 Server running on http://localhost:${PORT}`);
});
