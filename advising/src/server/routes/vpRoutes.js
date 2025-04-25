import { Router } from 'express';

import {getVPUserInfo} from '../VP/vpcontroller.js';
import { verifyToken } from '../middleware/auth.js';

import { getVPOverloadRequests,
    getVPOverloadRequestDetails,
    handleVPDecision,
getVPOverloadNotes,
addVPOverloadNote} from '../VP/vpoverload.js';





const router = Router();

router.get('/user-infoo', verifyToken,getVPUserInfo );
router.get('/overload-requests', verifyToken, getVPOverloadRequests);
router.get('/overload-requests/:requestId', verifyToken, getVPOverloadRequestDetails);
router.post('/overload-requests/:requestId/decision', verifyToken, handleVPDecision);


// Notes routes for VP
router.get('/:requestId/notes', verifyToken, getVPOverloadNotes);
router.post('/:requestId/notes', verifyToken , addVPOverloadNote);

export default router;