import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes); // POST /api/auth/login
app.use('/api/transactions', transactionRoutes); // GET /api/transactions, /export

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
