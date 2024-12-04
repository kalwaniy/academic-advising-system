import express from 'express';
import {
  getPendingCoopWaiverRequests,
  updateCoopVerification,
  notifyAdvisorAfterCoopReview,
  getCoopVerificationDetails,
  getCoordinatorNotes,
  addCoordinatorNote,
  getAllNotesByCoordinator,
  getCoopCompletionStatus,
  updateCoopCompletionStatus
} from '../coordinator/coordinatorcontroller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Ensure all routes are protected

// Get all pending COOP waiver requests
router.get('/coop-requests/pending', getPendingCoopWaiverRequests);

// Update COOP verification status
router.post('/coop-requests/:requestId/verify', updateCoopVerification);

// Notify advisor after COOP review
router.post('/coop-requests/:requestId/notify-advisor', notifyAdvisorAfterCoopReview);

// Get COOP verification details
router.get('/coop-requests/:requestId/details', getCoopVerificationDetails);

// Get notes for a specific request (with optional role filter)
router.get('/notes/:requestId', getCoordinatorNotes);

// Add a new note to a request
router.post('/notes/:requestId', addCoordinatorNote);

// Fetch all notes for a request (no role filter)
router.get('/all-notes/:requestId', getAllNotesByCoordinator);

router.get('/coop-completion/:studentId', getCoopCompletionStatus);

router.post('/coop-completion/:studentId', updateCoopCompletionStatus);

// Route to update COOP verification (mark completion)
router.post('/coop-verification/:requestId', updateCoopVerification);

// Route to notify advisor after COOP review completion
router.post('/coop-verification/:requestId/notify-advisor', notifyAdvisorAfterCoopReview);

// Route to get COOP verification details
router.get('/coop-verification/:requestId/details', getCoopVerificationDetails);


export default router;
