/* eslint-disable no-undef */
import { Router } from 'express';
import {
  getAdvisorDashboard,
  getStudentDetails,
  getAdvisorUserInfo,
  updateWaiverRequest,
  getCourses,
  getNotesByRequestId,
  upsertNote,
  addAdvisorNote,
  generateReport,
  sendToDeptChair,
  downloadExcelReport,
  getCompletedCoopReviews,
  addNote,
  uploadCsvFiles,
  sendToStudent, // Import the new controller function
  getAdvisorOverloadRequests,
  getAdvisorOverloadRequestDetails,
  updateAdvisorOverloadRequest,
  getOverloadNotes,
  addOverloadNote,
  sendToDean
} from '../advisor/advisordashboard.js'; // Import from the advisor folder
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', verifyToken, getAdvisorDashboard);

router.get('/student-details/:studentId', verifyToken, getStudentDetails);

router.get('/user-info', verifyToken, getAdvisorUserInfo);

router.put('/update-request/:requestId', verifyToken, updateWaiverRequest);

router.get('/courses', verifyToken, getCourses);

router.get('/notes/:requestId', verifyToken, getNotesByRequestId);

router.put('/notes/:requestId', verifyToken, upsertNote);

router.put('/notes/:requestId/advisor', verifyToken, addAdvisorNote);

router.get('/report', generateReport);

router.get('/download-excel-report', downloadExcelReport);

router.get('/completed-coop-reviews', verifyToken, getCompletedCoopReviews);

router.put('/send-to-dept-chair/:requestId', verifyToken, sendToDeptChair);

router.post('/notes/:requestId', verifyToken, addNote);

router.post('/upload-csv', verifyToken, uploadCsvFiles);

router.get('/overload-requests', verifyToken, getAdvisorOverloadRequests);
router.get('/overload-requests/:requestId', verifyToken, getAdvisorOverloadRequestDetails);
router.put('/overload-requests/:requestId', verifyToken, updateAdvisorOverloadRequest);
// GET notes for an overload request
router.get('/overload-requests/:requestId/notes', verifyToken, getOverloadNotes);

// POST add new note
router.post('/overload-requests/:requestId/notes', verifyToken, addOverloadNote);


// New route for sending notification/email to the student
router.post('/send-to-student/:requestId', verifyToken, sendToStudent);


router.post('/overload-requests/:requestId/send-to-dean', verifyToken, sendToDean);



export default router;
