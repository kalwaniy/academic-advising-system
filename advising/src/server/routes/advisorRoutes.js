import { Router } from 'express';
import {
  getAdvisorDashboard,
  getStudentDetails,
  getAdvisorUserInfo,
  updateWaiverRequest,
  getCourses,
  getNotesByRequestId,
  upsertNote,
  addAdvisorNote
} from '../advisor/advisordashboard.js'; // Import from the advisor folder
import { verifyToken } from '../middleware/auth.js';

const router = Router();


router.get('/dashboard', verifyToken, getAdvisorDashboard);


router.get('/student-details/:studentId', verifyToken, getStudentDetails);


router.get('/user-info', verifyToken, getAdvisorUserInfo);

router.put('/update-request/:requestId', verifyToken, updateWaiverRequest);

router.get('/courses', verifyToken, getCourses)

router.get('/notes/:requestId', verifyToken, getNotesByRequestId);
router.put('/notes/:requestId', verifyToken, upsertNote); // For upsert operations
router.put('/notes/:requestId/advisor', verifyToken, addAdvisorNote); // For advisor-specific logic



export default router;

