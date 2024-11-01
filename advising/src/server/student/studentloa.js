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
  console.log('Final attached User ID:', req.currentUser?.user_id);
  console.log('Raw Request Body:', req.body);
  console.log('File Data:', req.file);

  // Extract relevant fields from the request body and map correctly
  const {
    uid, // corresponds to submitted_by
    classRequest, // corresponds to course_code
    reason,
    detailedReason,
    seniorDesignRequest,
    term,
    coopWaiver,
  } = req.body;

  const documentPath = req.file ? req.file.path : null;

  // Define fields for insertion with correct mappings
  const waiverData = {
    request_id: null, // Auto-generated, set to NULL or use default if defined
    course_code: classRequest,
    course_title: req.body.course_title || 'Unknown Title', // set a fallback
    faculty_id: req.body.faculty_id || 'Unknown Faculty', // set a fallback if needed
    reason,
    justification: detailedReason,
    senior_design_request: seniorDesignRequest === 'yes' ? 1 : 0,
    status: 'Pending',
    term_requested: term,
    coop_request: coopWaiver === 'yes' ? 1 : 0,
    jd_document_path: documentPath,
    submitted_by: uid,
  };

  console.log('Extracted Values:', waiverData);

  // Check required fields before inserting into the database
  if (!waiverData.course_code || !waiverData.reason || !waiverData.submitted_by) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Database insertion query with properly mapped values
    const waiverQuery = `
      INSERT INTO prerequisite_waivers 
      (request_id, course_code, course_title, faculty_id, reason_to_take, justification, 
      senior_design_request, status, term_requested, coop_request, jd_document_path, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [result] = await db.query(waiverQuery, [
      waiverData.request_id,
      waiverData.course_code,
      waiverData.course_title,
      waiverData.faculty_id,
      waiverData.reason,
      waiverData.justification,
      waiverData.senior_design_request,
      waiverData.status,
      waiverData.term_requested,
      waiverData.coop_request,
      waiverData.jd_document_path,
      waiverData.submitted_by,
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

