import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getDepartmentChairUserInfo,
} from '../departmentchair/departmentchaircontroller.js';
import { getDeptChairDashboard,getStudentDetails }  from '../departmentchair/departmentChairDb.js'
const router = Router();


// Fetch department chair's user information
router.get('/user-info', verifyToken, getDepartmentChairUserInfo);
router.get('/dashboard', verifyToken, getDeptChairDashboard);
router.get('/student-details/:studentId', verifyToken, getStudentDetails);



export default router;

