import { Router } from 'express';
import { getStudentsLOA } from '../student/studentloa.js'; 


const router = Router();

// Route to get student information
router.get('/studentsloa', getStudentsLOA);

export default router;
