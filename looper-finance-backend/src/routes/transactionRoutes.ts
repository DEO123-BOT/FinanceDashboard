import express from 'express';
import { getTransactions, exportTransactions } from '../controllers/transactionController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ Secure and working routes
router.get('/', authenticateJWT, getTransactions);
router.get('/export', authenticateJWT, exportTransactions); // <-- THIS IS THE EXPORT ROUTE

export default router;
