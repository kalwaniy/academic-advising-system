import { Router } from 'express';
import multer from 'multer';
import { getStudentData, getCourses, submitWaiverRequest } from '../student/studentloa.js'; // Import functions from studentloa.js
import studentDashboardRoutes from '../student/studentdashboard.js'; 
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Configure multer for file uploads (using memory storage for now; adjust as needed)
const upload = multer({ storage: multer.memoryStorage() }); 

// Route to get student information (ensure token verification)
router.get('/student-data', verifyToken, getStudentData);

// Route to fetch available courses (ensure token verification)
router.get('/courses', verifyToken, getCourses);

// Route to submit a prerequisite waiver with file upload (ensure token verification)
router.post('/prerequisite-waiver/submit', verifyToken, upload.single('jdDocument'), submitWaiverRequest);

// Register student dashboard routes with token verification
router.use('/student-dashboard', verifyToken, studentDashboardRoutes);

export default router;
