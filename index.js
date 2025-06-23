const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve home.html at the root URL from the pages folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,  'pages', 'home.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});