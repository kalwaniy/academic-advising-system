import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getDepartmentChairUserInfo,
} from '../departmentchair/departmentchaircontroller.js';

const router = Router();


// Fetch department chair's user information
router.get('/user-info', verifyToken, getDepartmentChairUserInfo);

export default router;

