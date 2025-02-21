import { Router } from 'express';
import multer from 'multer';
import { getStudentData, getCourses, submitWaiverRequest, submitCourseOverloadRequest } from '../student/studentloa.js';
import studentDashboardRoutes from '../student/studentdashboard.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/student-data', verifyToken, getStudentData);
router.get('/courses', verifyToken, getCourses);
router.post('/prerequisite-waiver/submit', verifyToken, upload.single('jdDocument'), submitWaiverRequest);
router.post(
    '/course-overload/submit',
    verifyToken,          // if you want only authenticated students
    upload.none(),        // parse all text fields (no file) from FormData
    submitCourseOverloadRequest
  );

router.use('/student-dashboard', verifyToken, studentDashboardRoutes);



export default router;
