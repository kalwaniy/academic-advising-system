/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js'; // Ensure this is correctly set up
import logger from '../utils/logger.js';
import { logWithRequestContext } from '../utils/logger.js';

export const getDeptChairDashboard = async (req, res) => {
  try {
    logWithRequestContext(req, 'info', 'Fetching Dept Chair Dashboard');
    
    // Fetch "In-Review" requests
    const inReviewQuery = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.submitted_by, 
        s.first_name, s.last_name, pw.status
      FROM prerequisite_waivers AS pw
      JOIN students AS s ON pw.submitted_by = s.university_id
      WHERE pw.status = 'In-Review';
    `;
    const [inReviewRequests] = await db.query(inReviewQuery);

    // Fetch faculty members for each course
    const facultyMapping = {};
    for (const request of inReviewRequests) {
      const courseCode = request.course_code;
      const facultyQuery = `
        SELECT f.university_id, f.first_name, f.last_name, f.email_id
        FROM faculty_courses AS fc
        JOIN faculty AS f ON fc.faculty_id = f.university_id
        WHERE fc.course_code = ?;
      `;
      const [facultyRows] = await db.query(facultyQuery, [courseCode]);
      facultyMapping[request.request_id] = facultyRows; // Map faculty by request_id
    }

    // Fetch "Completed by Faculty" requests
    const completedQuery = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.submitted_by, 
        s.first_name, s.last_name, pw.status
      FROM prerequisite_waivers AS pw
      JOIN students AS s ON pw.submitted_by = s.university_id
      WHERE pw.status = 'Completed by Faculty';
    `;
    const [completedRequests] = await db.query(completedQuery);

    res.status(200).json({
      requests: inReviewRequests,
      completedRequests: completedRequests,
      facultyMapping, // Send faculty mapping
    });
  } catch (err) {
    console.error('Error fetching Dept Chair Dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getStudentDetails = async (req, res) => {
    const { studentId } = req.params;
  
    try {
      // Updated query to fetch all required student information
      const studentQuery = `
        SELECT 
          s.university_id, s.first_name, s.last_name, s.email_id, 
          a.CGPA AS cgpa, a.program, a.year_level, a.year_enrolled, a.current_semester_year AS current_term
        FROM students s
        JOIN student_academic_info a ON s.university_id = a.university_id
        WHERE s.university_id = ?;
      `;
      const [studentRows] = await db.query(studentQuery, [studentId]);
  
      if (studentRows.length === 0) {
        return res.status(404).json({ msg: 'Student not found' });
      }
  
      const studentData = studentRows[0];
  
      // Fetch course log with grades
      const courseLogQuery = `
        SELECT sc.course_code, c.course_title, sc.term_taken, sc.grade
        FROM student_courses sc
        JOIN courses c ON sc.course_code = c.course_code
        WHERE sc.student_id = ?;
      `;
      const [courseLogRows] = await db.query(courseLogQuery, [studentId]);
  
      // Attach course log data to the studentData object
      studentData.courseLog = courseLogRows;
  
      console.log('Fetched Student Details:', studentData);
  
      res.status(200).json(studentData);
    } catch (err) {
      console.error('Error fetching student details:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };

  export const getRequestNotes = async (req, res) => {
    const { requestId } = req.params;
    const { role } = req.query; // Allow optional role filtering

    try {
        let query = `
            SELECT note_id, user_id, role, note_text, created_at
            FROM request_notes
            WHERE request_id = ?
        `;

        const queryParams = [requestId];

        if (role) {
            query += ` AND role = ?`;
            queryParams.push(role);
        }

        query += ` ORDER BY created_at DESC`;

        const [notes] = await db.query(query, queryParams);

        if (!notes.length) {
            return res.status(404).json({ msg: 'No notes found for this request.' });
        }

        res.status(200).json(notes);
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).json({ error: 'Server error while fetching notes.' });
    }
};


export const addRequestNote = async (req, res) => {
  logWithRequestContext(req, 'info', 'Attempting to add a request note...');
  const { requestId } = req.params;
  const { note_text } = req.body;
  const userId = req.user_id; // Extracted from token via middleware
  const role = req.userRole; // Extracted role from middleware

  // Validate input
  if (!note_text || !requestId || !role) {
      logWithRequestContext(req, 'warn', 'Missing required fields for adding note');
      return res.status(400).json({ error: 'Note text, request ID, and role are required.' });
  }

  try {
      const query = `
          INSERT INTO request_notes (request_id, user_id, role, note_text)
          VALUES (?, ?, ?, ?);
      `;
      const [result] = await db.query(query, [requestId, userId, role, note_text]);

      if (result.affectedRows === 0) {
          logWithRequestContext(req, 'error', `Failed to add note for Request ID: ${requestId}`);
          return res.status(500).json({ error: 'Failed to add note.' });
      }

      logWithRequestContext(req, 'info', `Note added successfully for Request ID: ${requestId}`);
      res.status(201).json({ msg: 'Note added successfully.' });
  } catch (err) {
      logWithRequestContext(req, 'error', `Error adding note: ${err.message}`);
      res.status(500).json({ error: 'Server error while adding note.' });
  }
};


  export const getAllNotesByRequestId = async (req, res) => {
    const { requestId } = req.params;

    try {
        const query = `
            SELECT 
                note_id, user_id, role, note_text, created_at
            FROM 
                request_notes
            WHERE 
                request_id = ?
            ORDER BY 
                created_at DESC;
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


  

  export const getStudentPastCourses = async (req, res) => {
    const { studentId } = req.params;
  
    try {
      const query = `
        SELECT 
          sc.course_code, 
          c.course_title, 
          sc.term_taken, 
          sc.grade
        FROM student_courses AS sc
        JOIN courses AS c ON sc.course_code = c.course_code
        WHERE sc.student_id = ?;
      `;
      const [rows] = await db.query(query, [studentId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ msg: 'No past courses found for this student.' });
      }
  
      res.status(200).json(rows); // Return the list of past courses
    } catch (err) {
      console.error('Error fetching student past courses:', err);
      res.status(500).json({ error: 'Server error while fetching student past courses.' });
    }
  };
  

  export const getDeptChairNote = async (req, res) => {
    const { requestId } = req.params;
  
    try {
      const query = `
        SELECT note_id, user_id, role, note_text, created_at
        FROM request_notes
        WHERE request_id = ? AND role = 'dept_chair'
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const [rows] = await db.query(query, [requestId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ msg: 'No department chair notes found for this request.' });
      }
  
      res.status(200).json(rows[0]); // Return the most recent department chair note
    } catch (err) {
      console.error('Error fetching department chair note:', err);
      res.status(500).json({ error: 'Server error while fetching department chair note.' });
    }
  };

 

  export const sendToFaculty = async (req, res) => {
    logWithRequestContext(req, 'info', `Attempting to assign Request ID: ${req.params.requestId} to Faculty.`);
    const { requestId } = req.params;
    const { facultyId } = req.body;
  
    if (!facultyId) {
      logWithRequestContext(req, 'warn', 'Faculty ID is missing from the request body.');
      return res.status(400).json({ msg: 'Faculty ID is required.' });
    }
  
    try {
      // Step 1: Fetch faculty details
      const facultyQuery = `
        SELECT university_id, email_id, first_name, last_name
        FROM faculty
        WHERE university_id = ?;
      `;
      const [facultyRows] = await db.query(facultyQuery, [facultyId]);
  
      if (facultyRows.length === 0) {
        logWithRequestContext(req, 'warn', `Faculty with ID: ${facultyId} not found.`);
        return res.status(404).json({ msg: 'Faculty not found.' });
      }
  
      const { university_id: facultyUniversityId, email_id: facultyEmail, first_name: firstName, last_name: lastName } = facultyRows[0];
      logWithRequestContext(req, 'info', `Faculty details fetched: ${firstName} ${lastName} (${facultyEmail}).`);
  
      // Step 2: Update the request status
      const updateQuery = `
        UPDATE prerequisite_waivers
        SET status = 'In Review with Faculty', faculty_id = ?
        WHERE request_id = ?;
      `;
      const [updateResult] = await db.query(updateQuery, [facultyId, requestId]);
  
      if (updateResult.affectedRows === 0) {
        logWithRequestContext(req, 'warn', `Request with ID: ${requestId} not found or already updated.`);
        return res.status(404).json({ msg: 'Request not found or already updated.' });
      }
  
      // Step 3: Insert notification for the faculty
      const notificationQuery = `
        INSERT INTO notifications (user_id, message)
        VALUES (?, ?);
      `;
      const notificationMessage = `You have been assigned a new waiver request (Request ID: ${requestId}) for review.`;
      await db.query(notificationQuery, [facultyUniversityId, notificationMessage]);
  
      // Step 4: Send an email notification to the faculty
      const emailSubject = `New Request Assigned for Review (Request ID: ${requestId})`;
      const emailBody = `
        Dear ${firstName} ${lastName},
  
        A new prerequisite waiver request has been assigned to you for review.
  
        Request Details:
        - Request ID: ${requestId}
        - Status: In Review with Faculty
  
        Please log in to the system to review and take appropriate action.
  
        Best regards,
        University Waiver System
      `;
  
      await sendEmail(facultyEmail, emailSubject, emailBody);
      logWithRequestContext(req, 'info', `Email sent to faculty: ${facultyEmail} for Request ID: ${requestId}.`);
  
      // Step 5: Respond with success
      res.status(200).json({
        msg: 'Request successfully assigned to faculty, notification sent, and email sent.',
      });
    } catch (err) {
      logWithRequestContext(req, 'error', `Error assigning Request ID: ${requestId} to Faculty: ${err.message}`);
      res.status(500).json({ error: 'Server error while assigning request.' });
    }
  };
  
  
export const approveRequest = async (req, res) => {
  logWithRequestContext(req, 'info', `Attempting to approve Request ID: ${req.params.requestId}.`);
  const { requestId } = req.params;

  try {
    // Step 1: Update the request status to "Approved"
    const query = `
      UPDATE prerequisite_waivers
      SET status = 'Approved'
      WHERE request_id = ?;
    `;
    const [result] = await db.query(query, [requestId]);

    if (result.affectedRows === 0) {
      logWithRequestContext(req, 'warn', `Request with ID: ${requestId} not found or already approved.`);
      return res.status(404).json({ msg: 'Request not found or already updated.' });
    }

    logWithRequestContext(req, 'info', `Request ID: ${requestId} approved successfully.`);

    // Step 2: Fetch advisor's ID
    const advisorQuery = `
      SELECT advisor_id 
      FROM advisor_student_relation 
      WHERE student_id = (SELECT submitted_by FROM prerequisite_waivers WHERE request_id = ?);
    `;
    const [advisorResult] = await db.query(advisorQuery, [requestId]);

    if (advisorResult.length === 0) {
      logWithRequestContext(req, 'warn', `Advisor not found for Request ID: ${requestId}.`);
      return res.status(404).json({ msg: 'Advisor not found for this request.' });
    }

    const advisorId = advisorResult[0].advisor_id;

    // Step 3: Insert notification for the advisor
    const notificationQuery = `
      INSERT INTO notifications (user_id, message) 
      VALUES (?, ?);
    `;
    const notificationMessage = `Department Chair has approved the waiver request (Request ID: ${requestId}).`;
    await db.query(notificationQuery, [advisorId, notificationMessage]);

    res.status(200).json({ msg: 'Request approved successfully, and notification added for advisor.' });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error approving Request ID: ${requestId} - ${err.message}`);
    res.status(500).json({ error: 'Server error while approving request.' });
  }
};

export const rejectRequest = async (req, res) => {
  logWithRequestContext(req, 'info', `Attempting to reject Request ID: ${req.params.requestId}.`);
  const { requestId } = req.params;

  try {
    // Step 1: Update the request status to "Rejected"
    const query = `
      UPDATE prerequisite_waivers
      SET status = 'Rejected'
      WHERE request_id = ?;
    `;
    const [result] = await db.query(query, [requestId]);

    if (result.affectedRows === 0) {
      logWithRequestContext(req, 'warn', `Request with ID: ${requestId} not found or already rejected.`);
      return res.status(404).json({ msg: 'Request not found or already updated.' });
    }

    logWithRequestContext(req, 'info', `Request ID: ${requestId} rejected successfully.`);

    // Step 2: Fetch advisor's ID
    const advisorQuery = `
      SELECT advisor_id 
      FROM advisor_student_relation 
      WHERE student_id = (SELECT submitted_by FROM prerequisite_waivers WHERE request_id = ?);
    `;
    const [advisorResult] = await db.query(advisorQuery, [requestId]);

    if (advisorResult.length === 0) {
      logWithRequestContext(req, 'warn', `Advisor not found for Request ID: ${requestId}.`);
      return res.status(404).json({ msg: 'Advisor not found for this request.' });
    }

    const advisorId = advisorResult[0].advisor_id;

    // Step 3: Insert notification for the advisor
    const notificationQuery = `
      INSERT INTO notifications (user_id, message) 
      VALUES (?, ?);
    `;
    const notificationMessage = `Department Chair has rejected the waiver request (Request ID: ${requestId}).`;
    await db.query(notificationQuery, [advisorId, notificationMessage]);

    res.status(200).json({ msg: 'Request rejected successfully, and notification added for advisor.' });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error rejecting Request ID: ${requestId} - ${err.message}`);
    res.status(500).json({ error: 'Server error while rejecting request.' });
  }
};

  

  export const getAllLogs = async (req, res) => {
    logger.info('Fetching all logs...');
    try {
      const query = `SELECT * FROM logs ORDER BY timestamp DESC`;
      const [rows] = await db.query(query);
  
      logger.info('Fetched Logs', { count: rows.length });
      res.status(200).json(rows);
    } catch (error) {
      logger.error('Error fetching logs', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Server error while fetching logs.' });
    }
  };


