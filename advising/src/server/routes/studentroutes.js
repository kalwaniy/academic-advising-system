import { Router } from 'express';
import { getStudentData, submitWaiverRequest } from '../student/studentloa.js';
import studentDashboardRoutes from '../student/studentdashboard.js'; 
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Route to get student information
router.get('/student-data', getStudentData);

// Route to submit a prerequisite waiver
router.post('/prerequisite-waiver/submit', verifyToken, submitWaiverRequest);

// Register student dashboard routes (with token verification)
router.use('/student-dashboard', verifyToken, studentDashboardRoutes);

export default router;
