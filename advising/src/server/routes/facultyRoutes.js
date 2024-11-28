import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {getFacultyUserInfo} from '../faculty/facultyLanding.js';

import { getFacultyDashboard,
    getFacultyRequestNotes,
    addFacultyNote,
    completeReview
 } from '../faculty/facultyDB.js';

const router = Router();

router.get('/user-info', verifyToken,getFacultyUserInfo );

router.get('/dashboard',verifyToken, getFacultyDashboard);

router.get('/notes/:requestId', verifyToken, getFacultyRequestNotes);
router.post('/notes/:requestId', verifyToken, addFacultyNote);
router.patch('/complete-review/:requestId', verifyToken, completeReview);



export default router;