import { Router } from 'express';
import { getAdvisorDashboard,getStudentDetails } from '../advisor/advisordashboard.js'; // Import from the advisor folder
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Advisor dashboard route (requires token verification)
router.get('/dashboard', verifyToken, getAdvisorDashboard);
router.get('/student-details/:studentId', verifyToken, getStudentDetails);

export default router;
