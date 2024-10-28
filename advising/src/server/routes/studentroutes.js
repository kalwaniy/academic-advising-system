import { Router } from 'express';
import { getStudentData, getCourses, submitWaiverRequest } from '../student/studentloa.js'; // Correctly importing functions from studentloa.js
import studentDashboardRoutes from '../student/studentdashboard.js'; 
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Route to get student information (ensure token verification)
router.get('/student-data', verifyToken, getStudentData);

// Route to fetch available courses (ensure token verification)
router.get('/courses', verifyToken, getCourses);

// Route to submit a prerequisite waiver (ensure token verification)
router.post('/prerequisite-waiver/submit', verifyToken, submitWaiverRequest);

// Register student dashboard routes with token verification
router.use('/student-dashboard', verifyToken, studentDashboardRoutes);

export default router;
