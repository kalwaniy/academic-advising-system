import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {getFacultyUserInfo} from '../faculty/facultyLanding.js';

const router = Router();

router.get('/user-info', verifyToken,getFacultyUserInfo );

export default router;