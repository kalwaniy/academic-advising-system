import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {getFacultyUserInfo} from '../faculty/facultyLanding.js';

import { getFacultyDashboard } from '../faculty/facultyDB.js';

const router = Router();

router.get('/user-info', verifyToken,getFacultyUserInfo );

router.get('/dashboard',verifyToken, getFacultyDashboard);

export default router;