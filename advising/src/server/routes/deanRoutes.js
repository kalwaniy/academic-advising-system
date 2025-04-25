import { Router } from 'express';
import multer from 'multer';
import {getDeanUserInfo} from '../Dean/deanController.js';
import { verifyToken } from '../middleware/auth.js';
import {
    getDeanOverloadRequests,
    getDeanOverloadRequestDetails,
    handleDeanDecision,
    getOverloadNotes,
    addOverloadNote,
   sendToVP
  } from '../Dean/deanOverload.js';

const router = Router();

router.get('/user-info', verifyToken,getDeanUserInfo);

router.get('/dean/overload-requests', getDeanOverloadRequests);
router.get('/dean/overload-requests/:requestId', getDeanOverloadRequestDetails);
router.post('/dean/overload-requests/:requestId/decision', handleDeanDecision);

// Dean overload routes
router.get('/dean/overload-requests/:requestId/notes', verifyToken, getOverloadNotes);
router.post('/dean/overload-requests/:requestId/notes', verifyToken, addOverloadNote);

router.post('/overload-requests/:requestId/send-to-vp', verifyToken, sendToVP);

export default router;