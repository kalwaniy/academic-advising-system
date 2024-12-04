/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { sendEmail } from '../utils/email.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processStudentInfoCSV, processStudentCoursesCSV } from './csvProcessor.js';
import logger, { logWithRequestContext } from '../utils/logger.js';

export const getAdvisorDashboard = async (req, res) => {
  logWithRequestContext(req, 'info', 'Fetching advisor dashboard...');
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      logWithRequestContext(req, 'warn', 'No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const advisorId = decodedToken.user_id;
    logWithRequestContext(req, 'info', `Advisor ID from token: ${advisorId}`);

    const studentQuery = `
      SELECT student_id 
      FROM advisor_student_relation 
      WHERE advisor_id = ?;
    `;
    const [studentRows] = await db.query(studentQuery, [advisorId]);

    if (studentRows.length === 0) {
      logWithRequestContext(req, 'warn', `No students found for advisor: ${advisorId}`);
      return res.status(404).json({ msg: 'No students assigned to this advisor' });
    }

    const studentIds = studentRows.map(row => row.student_id);
    logWithRequestContext(req, 'debug', `Fetched student IDs: ${JSON.stringify(studentIds)}`);

    const requestsQuery = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.senior_design_request, pw.status, pw.term_requested, 
        pw.coop_request, pw.jd_document_path, pw.submitted_by, 
        s.first_name, s.last_name, pw.auto_processed
      FROM prerequisite_waivers AS pw
      JOIN students AS s ON pw.submitted_by = s.university_id
      WHERE pw.submitted_by IN (?);
    `;
    const [requests] = await db.query(requestsQuery, [studentIds]);

    if (requests.length === 0) {
      logWithRequestContext(req, 'info', `No waiver requests found for advisor ${advisorId}`);
      return res.status(404).json({ msg: 'No waiver requests found for assigned students' });
    }

    logWithRequestContext(req, 'debug', `Fetched waiver requests: ${JSON.stringify(requests)}`);
    res.status(200).json(requests);
  } catch (err) {
    logWithRequestContext(req, 'error', `Error in advisor dashboard: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStudentDetails = async (req, res) => {
  logWithRequestContext(req, 'info', 'Fetching student details...');
  const { studentId } = req.params;

  try {
    // Fetch basic student details
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
      logWithRequestContext(req, 'warn', `Student not found: ${studentId}`);
      return res.status(404).json({ msg: 'Student not found' });
    }

    const studentData = studentRows[0];
    logWithRequestContext(req, 'debug', `Fetched student data: ${JSON.stringify(studentData)}`);

    // Fetch course log
    const courseLogQuery = `
      SELECT sc.course_code, c.course_title, sc.term_taken, sc.grade
      FROM student_courses sc
      JOIN courses c ON sc.course_code = c.course_code
      WHERE sc.student_id = ?;
    `;
    const [courseLogRows] = await db.query(courseLogQuery, [studentId]);
    studentData.courseLog = courseLogRows;
    logWithRequestContext(req, 'debug', `Fetched course log: ${JSON.stringify(courseLogRows)}`);

    // Fetch prerequisites
    const prerequisitesQuery = `
      SELECT cp.prerequisite_course_code, c.course_title AS prerequisite_title
      FROM course_prerequisites cp
      JOIN courses c ON cp.prerequisite_course_code = c.course_code
      WHERE cp.course_code = ?;
    `;
    const [prerequisitesRows] = await db.query(prerequisitesQuery, [studentData.courseLog[0]?.course_code || '']);
    studentData.prerequisites = prerequisitesRows;
    logWithRequestContext(req, 'debug', `Fetched prerequisites: ${JSON.stringify(prerequisitesRows)}`);

    // Fetch COOP details
    const coopDetailsQuery = `
      SELECT coop_course, completed
      FROM coop_status
      WHERE student_id = ?;
    `;
    const [coopDetailsRows] = await db.query(coopDetailsQuery, [studentId]);
    studentData.coopDetails = coopDetailsRows || [];
    logWithRequestContext(req, 'debug', `Fetched COOP details: ${JSON.stringify(coopDetailsRows)}`);

    res.status(200).json(studentData);
  } catch (err) {
    logWithRequestContext(req, 'error', `Error fetching student details: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};




export const getAdvisorUserInfo = async (req, res) => {
  try {
    const advisorId = req.user_id; // Extract from verified token
    const query = `
      SELECT first_name, last_name 
      FROM academic_advisors
      WHERE university_id = ?;
    `;
    const [result] = await db.query(query, [advisorId]);

    if (result.length === 0) {
      return res.status(404).json({ msg: 'Advisor not found' });
    }

    const { first_name, last_name } = result[0];
    res.status(200).json({ firstName: first_name, lastName: last_name });
  } catch (error) {
    console.error('Error fetching advisor info:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateWaiverRequest = async (req, res) => {
  logWithRequestContext(req, 'info', 'Updating waiver request...');
  try {
    const { requestId } = req.params;
    const { course_code, course_title, reason_to_take, justification, term_requested, status } = req.body;

    // Log input parameters
    logWithRequestContext(req, 'debug', `Request ID: ${requestId}`);
    logWithRequestContext(req, 'debug', `Update Data: ${JSON.stringify({ course_code, course_title, reason_to_take, justification, term_requested, status })}`);

    // Ensure only valid fields are updated
    const updateQuery = `
      UPDATE prerequisite_waivers 
      SET 
        course_code = ?, 
        course_title = ?, 
        reason_to_take = ?, 
        justification = ?, 
        term_requested = ?, 
        status = ? 
      WHERE request_id = ?;
    `;

    const [result] = await db.query(updateQuery, [
      course_code,
      course_title,
      reason_to_take,
      justification,
      term_requested,
      status,
      requestId,
    ]);

    // Log database response
    logWithRequestContext(req, 'debug', `Database response: ${JSON.stringify(result)}`);

    if (result.affectedRows === 0) {
      logWithRequestContext(req, 'warn', `Waiver request not found or already updated for Request ID: ${requestId}`);
      return res.status(404).json({ msg: 'Request not found' });
    }

    logWithRequestContext(req, 'info', `Waiver request updated successfully for Request ID: ${requestId}`);
    res.status(200).json({ msg: 'Request updated successfully' });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error updating waiver request: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};


export const sendToStudent = async (req, res) => {
  const { requestId } = req.params;

  try {
    // Fetch the waiver request and student details
    const query = `
      SELECT pw.status, pw.course_title, s.email_id, s.first_name, s.last_name, s.university_id
      FROM prerequisite_waivers pw
      JOIN students s ON pw.submitted_by = s.university_id
      WHERE pw.request_id = ?;
    `;
    const [rows] = await db.query(query, [requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Request or student not found' });
    }

    const { status, course_title, email_id, first_name, last_name, university_id } = rows[0];

    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json({ msg: 'Only Approved or Rejected requests can be sent to the student.' });
    }

    // Prepare email content
    const emailSubject = `Waiver ${status}: ${course_title}`;
    const emailBody = `
Dear ${first_name} ${last_name},

Your waiver request for the course "${course_title}" has been ${status.toLowerCase()}.

Best regards,  
University Waiver System
    `;

    // Send email to the student
    await sendEmail(email_id, emailSubject, emailBody);
    logWithRequestContext(req, 'info', `Email sent to student (${email_id}) for Request ID: ${requestId}`);

    // Insert notification for the student
    const notificationQuery = `
      INSERT INTO notifications (user_id, message, is_read, created_at) 
      VALUES (?, ?, 0, NOW());
    `;
    const notificationMessage = `Your waiver request for "${course_title}" has been ${status.toLowerCase()}.`;
    await db.query(notificationQuery, [university_id, notificationMessage]);

    logWithRequestContext(req, 'info', `Notification added for student (${university_id}) for Request ID: ${requestId}`);

    res.status(200).json({ msg: `Notification and email sent to student for Request ID: ${requestId}` });
  } catch (err) {
    logWithRequestContext(req, 'error', `Error sending to student: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getCourses = async (req, res) => {
  try {
    // Fetch all courses with their codes and titles
    const query = `
      SELECT course_code, course_title
      FROM courses
      ORDER BY course_code ASC;
    `;
    const [courses] = await db.query(query);

    if (courses.length === 0) {
      return res.status(404).json({ msg: 'No courses found' });
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNotesByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    const query = `
      SELECT 
        note_id, 
        note_text AS content, 
        created_at, 
        role,
        user_id
      FROM request_notes
      WHERE request_id = ?;
    `;

    const [notes] = await db.query(query, [requestId]);

    if (!notes.length) {
      return res.status(404).json({ msg: 'No notes found for this request' });
    }

    res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



export const addNote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content, role } = req.body;
    const userId = req.user_id; // Extracted from middleware

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
      VALUES (?, ?, ?, ?, NOW());
    `;

    const [result] = await db.query(query, [requestId, userId, role || 'Advisor', content]);

    // Fetch the newly added note to return it
    const [newNoteRows] = await db.query(
      'SELECT note_id, note_text AS content, created_at, role, user_id FROM request_notes WHERE note_id = ?',
      [result.insertId]
    );

    res.status(200).json(newNoteRows[0]);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Server error' });
  }
};





export const upsertNote = async (req, res) => {
  logWithRequestContext(req, 'info', 'Upserting note...');
  try {
    const { requestId } = req.params;
    const { content, role } = req.body;
    const userId = req.user_id; // Extracted from middleware

    // Log critical input details
    logWithRequestContext(req, 'debug', `Request ID: ${requestId}`);
    logWithRequestContext(req, 'debug', `Note Content: ${content}`);
    logWithRequestContext(req, 'debug', `Role: ${role || 'Advisor'}, User ID: ${userId}`);

    if (!content) {
      logWithRequestContext(req, 'warn', 'Note content is required but missing');
      return res.status(400).json({ error: 'Note content is required' });
    }

    if (!userId) {
      logWithRequestContext(req, 'warn', 'User ID is missing from the request');
      return res.status(401).json({ error: 'User ID is required' });
    }

    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        note_text = VALUES(note_text), created_at = NOW();
    `;

    const [result] = await db.query(query, [requestId, userId, role || 'Advisor', content]);

    logWithRequestContext(req, 'info', `Note upserted successfully for Request ID: ${requestId}`);
    res.status(200).json({ msg: 'Note saved successfully', result });
  } catch (error) {
    logWithRequestContext(req, 'error', `Error upserting note: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addAdvisorNote = async (req, res) => {
  logWithRequestContext(req, 'info', 'Adding advisor note...');
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user_id; // Extract from middleware
    const role = req.userRole || 'Advisor';

    // Log critical input details
    logWithRequestContext(req, 'debug', `Request ID: ${requestId}`);
    logWithRequestContext(req, 'debug', `Note Content: ${content}`);
    logWithRequestContext(req, 'debug', `Role: ${role}, User ID: ${userId}`);

    if (!content) {
      logWithRequestContext(req, 'warn', 'Note content is required but missing');
      return res.status(400).json({ error: 'Note content is required' });
    }

    if (!userId) {
      logWithRequestContext(req, 'warn', 'User ID is missing from the request');
      return res.status(401).json({ error: 'User ID is required' });
    }

    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        note_text = VALUES(note_text), created_at = NOW();
    `;

    const [result] = await db.query(query, [requestId, userId, role, content]);

    logWithRequestContext(req, 'info', `Advisor note added successfully for Request ID: ${requestId}`);
    res.status(200).json({ msg: 'Note added successfully', result });
  } catch (error) {
    logWithRequestContext(req, 'error', `Error adding advisor note: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

export const generateReport = async (req, res) => {
  logWithRequestContext(req, 'info', 'Generating report...');
  try {
    const query = `
      SELECT 
          pw.course_code AS Course,
          COUNT(*) AS TotalRequests,
          AVG(ai.CGPA) AS AverageGPA,
          pw.status AS Status
      FROM prerequisite_waivers pw
      JOIN students s ON pw.submitted_by = s.university_id
      JOIN student_academic_info ai ON s.university_id = ai.university_id
      GROUP BY pw.course_code, pw.status
      ORDER BY TotalRequests DESC;
    `;

    const [results] = await db.query(query);
    logWithRequestContext(req, 'debug', `Report data fetched: ${JSON.stringify(results)}`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    logWithRequestContext(req, 'error', `Error generating report: ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const downloadExcelReport = async (req, res) => {
  logWithRequestContext(req, 'info', 'Generating Excel report...');
  try {
    const query = `
      SELECT 
          pw.course_code AS Course,
          COUNT(*) AS TotalRequests,
          AVG(ai.CGPA) AS AverageGPA,
          pw.status AS Status
      FROM prerequisite_waivers pw
      JOIN students s ON pw.submitted_by = s.university_id
      JOIN student_academic_info ai ON s.university_id = ai.university_id
      GROUP BY pw.course_code, pw.status
      ORDER BY TotalRequests DESC;
    `;

    const [results] = await db.query(query);
    logWithRequestContext(req, 'debug', `Data for Excel report: ${JSON.stringify(results)}`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    worksheet.columns = [
      { header: 'Course', key: 'Course', width: 20 },
      { header: 'Total Requests', key: 'TotalRequests', width: 15 },
      { header: 'Average GPA', key: 'AverageGPA', width: 15 },
      { header: 'Status', key: 'Status', width: 15 },
    ];

    worksheet.addRows(results);
    const buffer = await workbook.xlsx.writeBuffer();
    logWithRequestContext(req, 'info', 'Excel report generated successfully');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    res.send(buffer);
  } catch (error) {
    logWithRequestContext(req, 'error', `Error exporting Excel report: ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};





export const sendToDeptChair = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  try {
    // Validate input
    if (!requestId || !status) {
      return res.status(400).json({ msg: 'Invalid data provided' });
    }

    // Step 1: Fetch department chair's details
    const deptChairQuery = `
      SELECT university_id, email_id, first_name, last_name 
      FROM department_chairs 
      LIMIT 1;
    `;
    const [deptChairRows] = await db.query(deptChairQuery);

    if (deptChairRows.length === 0) {
      console.warn('No department chair found in the system.');
      return res.status(404).json({ msg: 'Department Chair not found.' });
    }

    const { university_id: deptChairId, email_id: deptChairEmail, first_name: firstName, last_name: lastName } = deptChairRows[0];

    // Step 2: Update the status of the waiver request
    const updateQuery = `
      UPDATE prerequisite_waivers 
      SET status = ? 
      WHERE request_id = ?;
    `;
    const [updateResult] = await db.query(updateQuery, [status, requestId]);

    if (updateResult.affectedRows === 0) {
      console.warn(`Request with ID ${requestId} not found or already updated.`);
      return res.status(404).json({ msg: 'Request not found.' });
    }

    // Step 3: Insert notification for department chair
    const notificationQuery = `
      INSERT INTO notifications (user_id, message) 
      VALUES (?, ?);
    `;
    const notificationMessage = `Advisor has sent a new waiver request (Request ID: ${requestId}) for review.`;
    await db.query(notificationQuery, [deptChairId, notificationMessage]);

    // Step 4: Send an email notification to the department chair
    const emailSubject = `New Waiver Request Needs Review (Request ID: ${requestId})`;
    const emailBody = `
      Dear ${firstName} ${lastName},

      A new prerequisite waiver request has been sent to your attention for review.

      Request Details:
      - Request ID: ${requestId}
      - Status: ${status}

      Please log in to the system to review and take appropriate action.

      Best regards,
      University Waiver System
    `;

    await sendEmail(deptChairEmail, emailSubject, emailBody);
    console.log(`Email sent to department chair (${deptChairEmail}).`);

    // Respond with success
    res.status(200).json({
      msg: 'Request status updated, notification added, and email sent to department chair.',
    });
  } catch (err) {
    console.error('Error updating request status or sending notification/email:', err);
    res.status(500).json({ msg: 'Server error while processing the request.' });
  }
};



export const getCompletedCoopReviews = async (req, res) => {
  const advisorId = req.user_id; // Assuming middleware sets this
  try {
    const query = `
      SELECT 
        pw.request_id,
        pw.course_code,
        pw.course_title,
        pw.term_requested,
        pw.status,
        s.first_name,
        s.last_name,
        cv.comments,
        cv.verified_at
      FROM prerequisite_waivers pw
      JOIN students s ON pw.submitted_by = s.university_id
      JOIN coop_verification cv ON pw.request_id = cv.waiver_id
      WHERE pw.status = 'COOP Review Complete'
      AND EXISTS (
        SELECT 1 
        FROM advisor_student_relation ar
        WHERE ar.advisor_id = ? 
        AND ar.student_id = pw.submitted_by
      )
      ORDER BY cv.verified_at DESC;
    `;
    const [completedRequests] = await db.query(query, [advisorId]);

    res.status(200).json({ success: true, data: completedRequests });
  } catch (err) {
    console.error('Error fetching completed COOP reviews:', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

export const upload = multer({
  dest: 'uploads/', // Ensure this directory exists and is writable
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: function (req, file, cb) {
    // Accept only CSV files
    const filetypes = /csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File upload only supports CSV files'));
  },
});

// Controller function to handle CSV upload
export const uploadCsvFiles = async (req, res) => {
  logWithRequestContext(req, 'info', 'Uploading CSV files...');
  try {
    // Use multer to handle the file upload
    upload.fields([
      { name: 'studentInfoFile', maxCount: 1 },
      { name: 'studentCoursesFile', maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        logWithRequestContext(req, 'error', `Multer error: ${err.message}`);
        return res.status(400).json({ error: err.message });
      }
      if (!req.files || !req.files['studentInfoFile'] || !req.files['studentCoursesFile']) {
        logWithRequestContext(req, 'warn', 'Both CSV files are required');
        return res.status(400).json({ error: 'Please upload both CSV files.' });
      }

      const studentInfoPath = req.files['studentInfoFile'][0].path;
      const studentCoursesPath = req.files['studentCoursesFile'][0].path;

      try {
        // Process the CSV files
        await processStudentInfoCSV(studentInfoPath);
        await processStudentCoursesCSV(studentCoursesPath);

        // Optionally delete the uploaded files
        fs.unlinkSync(studentInfoPath);
        fs.unlinkSync(studentCoursesPath);

        logWithRequestContext(req, 'info', 'CSV files processed successfully');
        res.status(200).json({ message: 'CSV files have been processed successfully.' });
      } catch (processingError) {
        logWithRequestContext(req, 'error', `Error processing CSV files: ${processingError.message}`);
        res.status(500).json({ error: 'An error occurred during CSV processing.' });
      }
    });
  } catch (error) {
    logWithRequestContext(req, 'error', `Error in uploadCsvFiles: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};




