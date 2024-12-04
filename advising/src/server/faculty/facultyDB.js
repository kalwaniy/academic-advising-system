/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js'; 
import logger from '../utils/logger.js';
import { logWithRequestContext } from '../utils/logger.js';


export const getFacultyDashboard = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const facultyId = decodedToken.user_id; // Extract faculty ID from token

    // Fetch waiver requests assigned to this faculty member
    const query = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.status
      FROM prerequisite_waivers AS pw
      WHERE pw.status = 'In Review with Facul' AND pw.faculty_id = ?;
    `;

    const [requests] = await db.query(query, [facultyId]);

    if (requests.length === 0) {
      return res.status(404).json({ msg: 'No requests assigned to you.' });
    }

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching Faculty Dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getFacultyRequestNotes = async (req, res) => {
  const { requestId } = req.params;

  try {
    const query = `
      SELECT note_id, user_id, role, note_text, created_at
      FROM request_notes
      WHERE request_id = ?;
    `;
    const [notes] = await db.query(query, [requestId]);

    if (!notes.length) {
      return res.status(404).json({ msg: 'No notes found for this request.' });
    }

    res.status(200).json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Server error while fetching notes.' });
  }
};

export const addFacultyNote = async (req, res) => {
  logWithRequestContext(req, 'info', `Attempting to add a faculty note for Request ID: ${req.params.requestId}.`);
  const { requestId } = req.params;
  const { note_text } = req.body;
  const userId = req.user_id; // Extracted from token via middleware
  const role = 'faculty'; // Hardcoded role for faculty notes

  if (!note_text || !requestId) {
    logWithRequestContext(req, 'warn', 'Missing required fields for adding faculty note.', { note_text, requestId });
    return res.status(400).json({ error: 'Note text and request ID are required.' });
  }

  try {
    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text)
      VALUES (?, ?, ?, ?);
    `;
    const [result] = await db.query(query, [requestId, userId, role, note_text]);

    if (result.affectedRows === 0) {
      logWithRequestContext(req, 'error', `Failed to add faculty note for Request ID: ${requestId}.`);
      return res.status(500).json({ error: 'Failed to add note.' });
    }

    logWithRequestContext(req, 'info', `Faculty note added successfully for Request ID: ${requestId}.`);
    res.status(201).json({ msg: 'Note added successfully.' });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error adding faculty note for Request ID: ${requestId} - ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Server error while adding note.' });
  }
};

export const completeReview = async (req, res) => {
  logWithRequestContext(req, 'info', `Attempting to complete review for Request ID: ${req.params.requestId}.`);
  const { requestId } = req.params;

  try {
    // Step 1: Fetch department chair details
    const deptChairQuery = `
      SELECT university_id, email_id, first_name, last_name
      FROM department_chairs
      WHERE department = (
        SELECT department FROM faculty WHERE university_id = (
          SELECT faculty_id FROM prerequisite_waivers WHERE request_id = ?
        )
      )
      LIMIT 1;
    `;
    const [deptChairResult] = await db.query(deptChairQuery, [requestId]);

    if (!deptChairResult || deptChairResult.length === 0) {
      logWithRequestContext(req, 'warn', `No department chair found for Request ID: ${requestId}.`);
      return res.status(404).json({ msg: "No department chair found for the faculty's department." });
    }

    const { university_id: deptChairUniversityId, email_id: deptChairEmail, first_name: firstName, last_name: lastName } = deptChairResult[0];

    // Step 2: Update the request status
    const updateQuery = `
      UPDATE prerequisite_waivers
      SET status = 'Completed by Faculty'
      WHERE request_id = ? AND status = 'In Review with Facul';
    `;
    const [updateResult] = await db.query(updateQuery, [requestId]);

    if (updateResult.affectedRows === 0) {
      logWithRequestContext(req, 'warn', `Request with ID: ${requestId} not found or already updated.`);
      return res.status(404).json({ msg: 'Request not found or already updated.' });
    }

    // Step 3: Insert notification for department chair
    const notificationQuery = `
      INSERT INTO notifications (user_id, message)
      VALUES (?, ?);
    `;
    const notificationMessage = `Faculty has completed the review for waiver request (Request ID: ${requestId}).`;
    await db.query(notificationQuery, [deptChairUniversityId, notificationMessage]);

    // Step 4: Send an email notification to the department chair
    const emailSubject = `Review Completion Notification (Request ID: ${requestId})`;
    const emailBody = `
      Dear ${firstName} ${lastName},

      The review for request ID ${requestId} has been completed by the assigned faculty.

      Please log in to the system to review the details and take further action if required.

      Best regards,
      University Waiver System
    `;

    await sendEmail(deptChairEmail, emailSubject, emailBody);
    logWithRequestContext(req, 'info', `Review completed and email sent successfully for Request ID: ${requestId}.`);

    // Step 5: Respond with success
    res.status(200).json({
      msg: 'Review completed successfully, notification sent, and email sent to department chair.',
    });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error completing review for Request ID: ${requestId} - ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Server error while completing review.' });
  }
};
