import { Router } from 'express';
import {
  getAdvisorDashboard,
  getStudentDetails,
  getAdvisorUserInfo
} from '../advisor/advisordashboard.js'; // Import from the advisor folder
import { verifyToken } from '../middleware/auth.js';

const router = Router();


router.get('/dashboard', verifyToken, getAdvisorDashboard);


router.get('/student-details/:studentId', verifyToken, getStudentDetails);

// Fetch advisor info for landing page
router.get('/user-info', verifyToken, getAdvisorUserInfo);




export default router;

