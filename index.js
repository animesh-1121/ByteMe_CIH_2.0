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

app.get('/earning', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'earning.html'));
});

app.get('/lesson', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'lesson.html'));
});

app.get('/mylesson', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'mylesson.html'));
});

app.get('/newlesson', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'newlesson.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});