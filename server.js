// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Import routes
const skillRoutes = require('./routes/skills');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const ipfsRoutes = require('./routes/ipfs');

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/skills', skillRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ipfs', ipfsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    contracts: {
      learnToken: process.env.LEARN_TOKEN_ADDRESS,
      learnPlatform: process.env.LEARN_PLATFORM_ADDRESS
    }
  });
});

// Contract configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    contracts: {
      learnToken: process.env.LEARN_TOKEN_ADDRESS,
      learnPlatform: process.env.LEARN_PLATFORM_ADDRESS,
      network: process.env.NETWORK_NAME || 'polygon'
    },
    ipfs: {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
    }
  });
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room
  socket.on('join-user-room', (userAddress) => {
    socket.join(user-${userAddress});
    console.log(User ${userAddress} joined their room);
  });

  // Handle skill creation notifications
  socket.on('skill-created', (data) => {
    io.emit('new-skill', data);
  });

  // Handle session updates
  socket.on('session-update', (data) => {
    io.to(user-${data.studentAddress}).emit('session-updated', data);
    io.to(user-${data.instructorAddress}).emit('session-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve static HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});









app.get('/explore', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'explore.html'));
});

app.get('/earning', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'earning.html'));
});




// Serve React app for all non-API routes (if you have one, otherwise adjust or remove)
app.get('*', (req, res) => {
  // If you have a main index.html for a SPA, serve it here.
  // If not, you might want to send a 404 or redirect to home.
  // For now, let's assume there might be other static assets in 'public' or a SPA.
  // If 'public/index.html' is not the intended fallback, this should be changed.
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if public/index.html doesn't exist, e.g., redirect to home or send 404
    res.status(404).send('Page not found or public/index.html missing.');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(🚀 Server running on port ${PORT});
  console.log(📊 Health check: http://localhost:${PORT}/api/health);
  console.log(🔧 Config: http://localhost:${PORT}/api/config);
});

module.exports = { app, server, io };