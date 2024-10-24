import { Router } from 'express';
import { getStudentData, submitWaiverRequest } from '../student/studentloa.js';

const router = Router();

// Route to get student information
router.get('/student-data', getStudentData);

// Route to submit a prerequisite waiver
router.post('/submit-waiver', submitWaiverRequest);

export default router;