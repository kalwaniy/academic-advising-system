import express from 'express';
import { getNotifications } from '../notification/notificationController.js';
import { verifyToken } from '../middleware/auth.js'; // Ensure user authentication

const router = express.Router();

router.get('/notifications', verifyToken, getNotifications);

export default router;
