require('dotenv').config();
const express = require('express');

// Conf app and port
const app = express();
const PORT = process.env.PORT;

// Middleware -> express.json()
app.use(express.json());

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
