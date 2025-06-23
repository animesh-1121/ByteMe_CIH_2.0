const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

// Profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'profile.html'));
});

app.get('/explore', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'explore.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});