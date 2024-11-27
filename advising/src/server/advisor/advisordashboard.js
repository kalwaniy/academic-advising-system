/* eslint-disable no-undef */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';

export const getAdvisorDashboard = async (req, res) => {
  try {
    // Extract token and decode it
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const advisorId = decodedToken.user_id;
    console.log('Advisor ID from token:', advisorId);

    // Step 1: Fetch students assigned to this advisor
    const studentQuery = `
      SELECT student_id 
      FROM advisor_student_relation 
      WHERE advisor_id = ?;
    `;
    const [studentRows] = await db.query(studentQuery, [advisorId]);

    if (studentRows.length === 0) {
      console.warn('No students found for advisor:', advisorId);
      return res.status(404).json({ msg: 'No students assigned to this advisor' });
    }

    // Extract student IDs
    const studentIds = studentRows.map(row => row.student_id);
    console.log('Student IDs:', studentIds);

    // Step 2: Fetch waiver requests for these students
    const requestsQuery = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.senior_design_request, pw.status, pw.term_requested, 
        pw.coop_request, pw.jd_document_path, pw.submitted_by, 
        s.first_name, s.last_name
      FROM prerequisite_waivers AS pw
      JOIN students AS s ON pw.submitted_by = s.university_id
      WHERE pw.submitted_by IN (?);
    `;

    const [requests] = await db.query(requestsQuery, [studentIds]);

    if (requests.length === 0) {
      return res.status(404).json({ msg: 'No waiver requests found for assigned students' });
    }

    console.log('Requests fetched:', requests);
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error in advisor dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStudentDetails = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Fetch student details
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

    // Fetch course log
    const courseLogQuery = `
      SELECT sc.course_code, c.course_title, sc.term_taken, sc.grade
      FROM student_courses sc
      JOIN courses c ON sc.course_code = c.course_code
      WHERE sc.student_id = ?;
    `;
    const [courseLogRows] = await db.query(courseLogQuery, [studentId]);
    studentData.courseLog = courseLogRows;

    // Fetch course prerequisites
    const prerequisitesQuery = `
      SELECT cp.prerequisite_course_code, c.course_title AS prerequisite_title
      FROM course_prerequisites cp
      JOIN courses c ON cp.prerequisite_course_code = c.course_code
      WHERE cp.course_code = ?;
    `;
    const [prerequisitesRows] = await db.query(prerequisitesQuery, [studentData.courseLog[0]?.course_code || '']);
    studentData.prerequisites = prerequisitesRows;

    console.log('Fetched Student Details with Prerequisites:', studentData);

    res.status(200).json(studentData);
  } catch (err) {
    console.error('Error fetching student details:', err);
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
  try {
    const { requestId } = req.params;
    const { course_code, course_title, reason_to_take, justification, term_requested, status } = req.body;

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

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    res.status(200).json({ msg: 'Request updated successfully' });
  } catch (err) {
    console.error('Error updating request:', err);
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
      SELECT note_id, note_text AS content, created_at
      FROM request_notes
      WHERE request_id = ?;
    `;
    const [notes] = await db.query(query, [requestId]);

    if (notes.length === 0) {
      // Return an empty note object instead of 404
      return res.status(200).json([{ content: '' }]);
    }

    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



export const upsertNote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content, role } = req.body;
    const userId = req.user_id; // Extracted from middleware

    // Debug logs
    console.log('Request ID:', requestId);
    console.log('Note Content:', content);
    console.log('User ID (from middleware):', userId); // Check this log

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        note_text = VALUES(note_text), created_at = NOW();
    `;

    const [result] = await db.query(query, [requestId, userId, role || 'Advisor', content]);

    res.status(200).json({ msg: 'Note saved successfully', result });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Server error' });
  }
};




export const addAdvisorNote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user_id; // Extract from middleware
    const role = req.userRole || 'Advisor';

    // Log all critical variables
    console.log('Request ID:', requestId);
    console.log('Note Content:', content);
    console.log('User ID (from middleware):', userId);
    console.log('Role:', role);

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    // Database query
    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        note_text = VALUES(note_text), created_at = NOW();
    `;
    console.log('Executing query with parameters:', [requestId, userId, role, content]);

    const [result] = await db.query(query, [requestId, userId, role, content]);

    console.log('Query executed successfully:', result);
    res.status(200).json({ msg: 'Note added successfully', result });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


export const generateReport = async (req, res) => {
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

      const [results] = await db.query(query); // Use your database client
      res.status(200).json({ success: true, data: results });
  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const sendToDeptChair = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  try {
    // Ensure the request ID and status are valid
    if (!requestId || !status) {
      return res.status(400).json({ msg: 'Invalid data provided' });
    }

    // Update the status in the database
    const query = `
      UPDATE prerequisite_waivers 
      SET status = ? 
      WHERE request_id = ?;
    `;
    const [result] = await db.query(query, [status, requestId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    console.log(`Request ${requestId} status updated to ${status}`);
    res.status(200).json({ msg: 'Request status updated successfully' });
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};