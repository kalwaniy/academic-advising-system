/* eslint-disable no-undef */
import db from '../db/db.js';

// Function to get student data from 'students' and 'student_academic_info' tables
// In studentloa.js
const getStudentData = async (req, res) => {
  try {
    const userID = req.user_id || req.currentUser?.user_id;
    console.log('User ID from token:', userID);

    if (!userID) {
      console.error('User ID not found in request');
      return res.status(400).json({ msg: 'User ID is required' });
    }

    // Database query for user data
    const studentQuery = `
      SELECT s.university_id, s.first_name, s.last_name, s.email_id, a.CGPA
      FROM students AS s
      JOIN student_academic_info AS a ON s.university_id = a.university_id
      WHERE s.university_id = ?
    `;
    const [rows] = await db.query(studentQuery, [userID]);

    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn('Student not found for ID:', userID);
      return res.status(404).json({ msg: 'Student not found' });
    }

    const studentData = rows[0];
    res.status(200).json(studentData);
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const submitWaiverRequest = async (req, res) => {
  console.log('Raw Request Body:', req.body);

  // Extract and log the request body
  const {
    classRequest, // should contain course code
    reason,
    detailedReason,
    seniorDesignRequest = 'no',
    term,
    coopWaiver = 'no',
    submitted_by,
  } = req.body;

  console.log('Extracted Values:', {
    classRequest,
    reason,
    detailedReason,
    seniorDesignRequest,
    term,
    coopWaiver,
    submitted_by,
  });

  // Validate that essential fields are populated
  if (!classRequest || !reason || !submitted_by) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Query to fetch the course title based on course code
    const [courseRows] = await db.query('SELECT course_title FROM courses WHERE course_code = ?', [classRequest]);
    const course_title = courseRows.length > 0 ? courseRows[0].course_title : null;

    if (!course_title) {
      console.warn(`Course not found for course code: ${classRequest}`);
      return res.status(400).json({ msg: 'Course not found.' });
    }

    // Query to fetch the faculty_id based on course code
    const facultyQuery = `
      SELECT fc.faculty_id
      FROM faculty_courses fc
      JOIN faculty f ON fc.faculty_id = f.university_id
      WHERE fc.course_code = ?;
    `;
    const [facultyRows] = await db.query(facultyQuery, [classRequest]);
    const facultyId = facultyRows.length > 0 ? facultyRows[0].faculty_id : null;

    if (!facultyId) {
      console.warn(`No faculty found for course code: ${classRequest}`);
      return res.status(400).json({ msg: `No faculty available for course code ${classRequest}.` });
    }

    console.log('Final extracted data:', {
      request_id: null, // assuming request_id is auto-generated
      classRequest,
      course_title,
      facultyId,
      reason,
      detailedReason,
      seniorDesignRequest: seniorDesignRequest === 'yes' ? 1 : 0,
      term,
      coopWaiver: coopWaiver === 'yes' ? 1 : 0,
      documentPath: null, // Handle jdDocument here if uploaded
      submitted_by,
    });

    // Insert waiver request into database
    const waiverQuery = `
      INSERT INTO prerequisite_waivers 
      (request_id, course_code, course_title, faculty_id, reason_to_take, justification, 
      senior_design_request, status, term_requested, coop_request, jd_document_path, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?);
    `;

    const [result] = await db.query(waiverQuery, [
      null, // auto-generated request_id
      classRequest,
      course_title,
      facultyId,
      reason,
      detailedReason,
      seniorDesignRequest === 'yes' ? 1 : 0,
      term,
      coopWaiver === 'yes' ? 1 : 0,
      null, // handle jdDocument if uploaded
      submitted_by,
    ]);

    console.log('Waiver submission result:', result);
    res.status(200).json({ success: true, msg: 'Prerequisite waiver request submitted successfully!' });
  } catch (err) {
    console.error('Error submitting waiver request:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


// Function to get all available courses
const getCourses = async (req, res) => {
  try {
    console.log('Fetching courses...');

    const coursesQuery = `
      SELECT course_code, course_title
      FROM courses;
    `;
    const [rows] = await db.query(coursesQuery);
    console.log('Raw Query Result:', rows);

    if (rows.length === 0) {
      console.warn('No courses found');
      return res.status(404).json({ msg: 'No courses found' });
    }

    // Format the courses for response
    const formattedCourses = rows.map((course) => ({
      course_code: course.course_code,
      course_title: course.course_title,
    }));

    console.log('Formatted Courses:', formattedCourses);
    res.status(200).json(formattedCourses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Export all functions as named exports
export { getStudentData, submitWaiverRequest, getCourses };

