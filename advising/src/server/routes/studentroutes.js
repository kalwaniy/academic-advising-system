import { Router } from 'express';
import multer from 'multer';
import { getStudentData, getCourses, submitWaiverRequest } from '../student/studentloa.js';
import studentDashboardRoutes from '../student/studentdashboard.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/student-data', verifyToken, getStudentData);
router.get('/courses', verifyToken, getCourses);
router.post('/prerequisite-waiver/submit', verifyToken, upload.single('jdDocument'), submitWaiverRequest);

router.use('/student-dashboard', verifyToken, studentDashboardRoutes);



export default router;
