/* eslint-disable no-undef */
import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';



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
  const {
    classRequest,
    reason,
    detailedReason,
    term,
    submitted_by,
  } = req.body;

  // Extract seniorDesignRequest and coopWaiver
  const seniorDesignRequest = req.body.seniorDesignRequest ? parseInt(req.body.seniorDesignRequest, 10) : 0;
  const coopWaiver = req.body.coopWaiver ? parseInt(req.body.coopWaiver, 10) : 0;

  if (!classRequest || !reason || !submitted_by) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Fetch course details
    const [courseRows] = await db.query('SELECT course_title FROM courses WHERE course_code = ?', [classRequest]);

    if (!courseRows.length) {
      console.warn(`No course found for code: ${classRequest}`);
      return res.status(400).json({ msg: 'Course not found.' });
    }
    const course_title = courseRows[0].course_title;

    // Fetch advisor information for the student
    const [advisorRows] = await db.query(
      `SELECT aa.email_id AS advisor_email, aa.first_name, aa.last_name
       FROM academic_advisors aa
       JOIN advisor_student_relation ar ON aa.university_id = ar.advisor_id
       WHERE ar.student_id = ?`,
      [submitted_by]
    );

    if (!advisorRows.length) {
      console.warn(`No advisor found for student: ${submitted_by}`);
      return res.status(400).json({ msg: 'No advisor found for the student.' });
    }

    const { advisor_email, first_name: advisorFirstName, last_name: advisorLastName } = advisorRows[0];

    // Determine the status of the request
    const status = coopWaiver === 1 ? 'Pending with COOP' : 'Pending';

    // Insert waiver request into the database, including seniorDesignRequest and coopWaiver
    const waiverQuery = `
      INSERT INTO prerequisite_waivers 
      (course_code, course_title, reason_to_take, justification, term_requested, submitted_by, senior_design_request, coop_request, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await db.query(waiverQuery, [
      classRequest,
      course_title,
      reason,
      detailedReason,
      term,
      submitted_by,
      seniorDesignRequest,
      coopWaiver,
      status,
    ]);

    // Send email notification to the advisor
    if (advisor_email) {
      const emailSubject = `New Prerequisite Waiver Request: ${course_title}`;
      const emailBody = `
        Dear ${advisorFirstName} ${advisorLastName},

        A new prerequisite waiver request has been submitted by the student with University ID: ${submitted_by}.

        Details:
        - **Course Code:** ${classRequest}
        - **Course Title:** ${course_title}
        - **Term Requested:** ${term}
        - **Reason:** ${reason}
        - **Detailed Reason:** ${detailedReason}
        - **Senior Design Request:** ${seniorDesignRequest ? 'Yes' : 'No'}
        - **COOP Waiver:** ${coopWaiver ? 'Yes' : 'No'}

        Please log in to the advisor dashboard to review and process the request.

        Best regards,
        University Waiver System
      `;

      await sendEmail(advisor_email, emailSubject, emailBody);
      console.log(`Email sent to advisor (${advisor_email})`);
    }

    res.status(200).json({ success: true, msg: 'Prerequisite waiver request submitted successfully.' });
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

