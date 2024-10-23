import { Router } from 'express';
import { getStudentsLOA, submitWaiverRequest } from '../student/studentloa.js';  


  const router = Router();

  // Route to get student information
  router.get('/studentsloa', getStudentsLOA);
  
  // Route to submit a prerequisite waiver
  router.post('/submit-waiver', submitWaiverRequest);

  export default router;
