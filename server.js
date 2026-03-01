// Entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files are colocated under models/routes
const authRoutes = require('./models/routes/authroutes');
const taskRoutes = require('./models/routes/taskroutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Start server after DB connection
(async () => {
  try {
    await connectDB();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', taskRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      console.error(err);
      const status = err.status || 500;
      res.status(status).json({ error: err.message || 'Server Error' });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB error:', err.message);
    process.exit(1);
  }
})();
