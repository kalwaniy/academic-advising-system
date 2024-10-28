import db from '../db/db.js';

// Function to get student data from 'students' and 'student_academic_info' tables
const getStudentData = async (req, res) => {
  try {
    const userID = req.currentUser.user_id; // Assuming user_id is attached to the request from the token
    console.log('User ID from token:', userID);

    // Query to get student personal data from 'students' and 'student_academic_info' tables
    const studentQuery = `
      SELECT s.university_id, s.first_name, s.last_name, s.email_id, a.CGPA
      FROM students AS s
      JOIN student_academic_info AS a ON s.university_id = a.university_id
      WHERE s.university_id = ?
    `;
    const [rows] = await db.query(studentQuery, [userID]);

    // Convert RowDataPacket to array (if it's not already an array)
    const studentData = Array.isArray(rows) ? rows : [rows];
    console.log('Query Result:', studentData);

    if (studentData.length === 0 || !studentData[0].university_id) {
      console.warn('Student not found for ID:', userID);
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.status(200).json(studentData[0]); // Return the first result as an object
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Function to submit a prerequisite waiver request
const submitWaiverRequest = async (req, res) => {
  const {
    uid,
    name,
    email,
    cgpa,
    term,
    classRequest,
    reason,
    detailedReason,
    seniorDesignRequest,
    coopWaiver,
  } = req.body;

  try {
    console.log('Submitting Waiver Request for:', uid);

    // Insert waiver request into the 'prerequisite_waivers' table
    const waiverQuery = `
      INSERT INTO prerequisite_waivers 
      (submitted_by, name, email, cgpa, term_requested, course_code, reason_to_take, justification, senior_design_request, coop_request)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await db.query(waiverQuery, [
      uid,
      name,
      email,
      cgpa,
      term,
      classRequest,
      reason,
      detailedReason,
      seniorDesignRequest,
      coopWaiver,
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

    // Run query and manually handle the result to ensure it’s an array
    const [rows] = await db.query(coursesQuery);

    // Ensure the result is an array
    const courses = Array.isArray(rows) ? rows : [rows];

    if (courses.length === 0) {
      console.warn('No courses found');
      return res.status(404).json({ msg: 'No courses found' });
    }

    // Map to the desired format
    const formattedCourses = courses.map(course => ({
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
