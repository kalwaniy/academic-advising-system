import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getDepartmentChairUserInfo,
} from '../departmentchair/departmentchaircontroller.js';
import { getDeptChairDashboard,
  getStudentDetails,
  getRequestNotes,
   addRequestNote,
    getLatestAdvisorNote,
  getStudentPastCourses,
getDeptChairNote,
sendToFaculty }  from '../departmentchair/departmentChairDb.js'
const router = Router();


// Fetch department chair's user information
router.get('/user-info', verifyToken, getDepartmentChairUserInfo);
router.get('/dashboard', verifyToken, getDeptChairDashboard);
router.get('/student-details/:studentId', verifyToken, getStudentDetails);
// Fetch all notes for a request
router.get('/notes/:requestId', verifyToken, getRequestNotes);

// Add a new note to a request
router.post('/notes/:requestId', verifyToken, addRequestNote);

router.get('/latest-advisor-note/:requestId', verifyToken, getLatestAdvisorNote);

router.get('/student-past-courses/:studentId', verifyToken, getStudentPastCourses);

router.get('/dept-chair-note/:requestId', verifyToken, getDeptChairNote);

router.patch('/send-to-faculty/:requestId', sendToFaculty);







export default router;

