/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email.js'; // Ensure this is correctly set up

export const getDeptChairDashboard = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

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

    console.log('Fetched In-Review Requests:', inReviewRequests); // Debug log

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

    console.log('Fetched Completed Requests:', completedRequests); // Debug log

    // Fetch faculty members
    const facultyQuery = `SELECT user_id, username FROM users WHERE role = 'faculty';`;
    const [facultyMembers] = await db.query(facultyQuery);

    // Return data for both request categories
    res.status(200).json({
      requests: inReviewRequests,
      completedRequests: completedRequests,
      facultyMembers,
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
    const { requestId } = req.params;
    const { note_text } = req.body;
    const userId = req.user_id; // Extracted from token via middleware
    const role = req.userRole; // Extracted role from middleware
  
    if (!note_text || !requestId || !role) {
      console.error('Missing required fields:', { note_text, requestId, role });
      return res.status(400).json({ error: 'Note text, request ID, and role are required.' });
    }
  
    try {
      const query = `
        INSERT INTO request_notes (request_id, user_id, role, note_text)
        VALUES (?, ?, ?, ?);
      `;
      const [result] = await db.query(query, [requestId, userId, role, note_text]);
  
      if (result.affectedRows === 0) {
        return res.status(500).json({ error: 'Failed to add note.' });
      }
  
      res.status(201).json({ msg: 'Note added successfully.' });
    } catch (err) {
      console.error('Error adding note:', err);
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
    const { requestId } = req.params;
    const { facultyId } = req.body;
  
    if (!facultyId) {
      return res.status(400).json({ msg: 'Faculty ID is required.' });
    }
  
    try {
      // Fetch faculty details from the `faculty` table
      const facultyQuery = `
        SELECT email_id, first_name, last_name
        FROM faculty
        WHERE university_id = ?;
      `;
      const [facultyRows] = await db.query(facultyQuery, [facultyId]);
  
      if (facultyRows.length === 0) {
        return res.status(404).json({ msg: 'Faculty not found.' });
      }
  
      const { email_id: facultyEmail, first_name: firstName, last_name: lastName } = facultyRows[0];
  
      // Update the request status
      const query = `
        UPDATE prerequisite_waivers
        SET status = 'In Review with Faculty', faculty_id = ?
        WHERE request_id = ?;
      `;
      const [result] = await db.query(query, [facultyId, requestId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: 'Request not found or already updated.' });
      }
  
      // Send an email notification to the faculty
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
      console.log(`Email sent to faculty (${facultyEmail}).`);
  
      res.status(200).json({ msg: 'Request successfully assigned to faculty and email sent.' });
    } catch (err) {
      console.error('Error assigning request to faculty or sending email:', err);
      res.status(500).json({ error: 'Server error while assigning request.' });
    }
  };
  

  export const approveRequest = async (req, res) => {
    const { requestId } = req.params;
  
    try {
      const query = `
        UPDATE prerequisite_waivers
        SET status = 'Approved'
        WHERE request_id = ?;
      `;
      const [result] = await db.query(query, [requestId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: 'Request not found or already updated.' });
      }
  
      res.status(200).json({ msg: 'Request approved successfully.' });
    } catch (err) {
      console.error('Error approving request:', err);
      res.status(500).json({ error: 'Server error while approving request.' });
    }
  };

  
  export const rejectRequest = async (req, res) => {
    const { requestId } = req.params;
  
    try {
      const query = `
        UPDATE prerequisite_waivers
        SET status = 'Rejected'
        WHERE request_id = ?;
      `;
      const [result] = await db.query(query, [requestId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: 'Request not found or already updated.' });
      }
  
      res.status(200).json({ msg: 'Request rejected successfully.' });
    } catch (err) {
      console.error('Error rejecting request:', err);
      res.status(500).json({ error: 'Server error while rejecting request.' });
    }
  };
  