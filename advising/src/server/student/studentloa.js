/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';
import { evaluateAutoProcessing } from '../utils/autoProcessingRules.js';
import logger, { logWithRequestContext } from '../utils/logger.js';


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
  // Destructure and rename variables from req.body to avoid conflicts
  const {
    classRequest,
    reason: studentReason,
    detailedReason,
    term,
    submitted_by,
  } = req.body;

  // Extract seniorDesignRequest and coopWaiver
  const seniorDesignRequest = req.body.seniorDesignRequest ? parseInt(req.body.seniorDesignRequest, 10) : 0;
  const coopWaiver = req.body.coopWaiver ? parseInt(req.body.coopWaiver, 10) : 0;

  // Validate required fields
  if (!classRequest || !studentReason || !submitted_by) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Fetch course details
    const [courseRows] = await db.query('SELECT course_title FROM courses WHERE course_code = ?', [classRequest]);

    if (!courseRows.length) {
      logger.warn(`No course found for code: ${classRequest}`);
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
      logger.warn(`No advisor found for student: ${submitted_by}`);
      return res.status(400).json({ msg: 'No advisor found for the student.' });
    }

    const { advisor_email, first_name: advisorFirstName, last_name: advisorLastName } = advisorRows[0];

    // Create the request object for evaluation
    const request = {
      course_code: classRequest,
      submitted_by,
    };

    // Evaluate the request using the auto-processing rules
    const evaluationResult = await evaluateAutoProcessing(request);

    // Extract status and autoProcessReason from the evaluation result
    let status = 'Pending';
    let autoProcessReason = '';
    if (evaluationResult && evaluationResult.status) {
      status = evaluationResult.status;
      autoProcessReason = evaluationResult.reason || '';
    }

    // Determine the auto_processed flag
    const auto_processed = (status === 'Approved' || status === 'Rejected') ? 1 : 0;

    // If it's a COOP Waiver, adjust the status accordingly
    if (coopWaiver === 1) {
      status = 'Pending with COOP';
    }

    // Insert waiver request into the database
    const waiverQuery = `
      INSERT INTO prerequisite_waivers 
      (course_code, course_title, reason_to_take, justification, term_requested, submitted_by, senior_design_request, coop_request, status, auto_processed, auto_process_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await db.query(waiverQuery, [
      classRequest,
      course_title,
      studentReason,
      detailedReason,
      term,
      submitted_by,
      seniorDesignRequest,
      coopWaiver,
      status,
      auto_processed,
      autoProcessReason,
    ]);

    // Notify the student about the result
    const studentEmailQuery = 'SELECT email_id, first_name, last_name FROM students WHERE university_id = ?';
    const [studentRows] = await db.query(studentEmailQuery, [submitted_by]);

    if (studentRows.length) {
      const { email_id: studentEmail, first_name: studentFirstName, last_name: studentLastName } = studentRows[0];

      let emailSubject = '';
      let emailBody = '';

      if (status === 'Approved') {
        // Auto-approved
        emailSubject = `Prerequisite Waiver Request Approved: ${course_title}`;
        emailBody = `
Dear ${studentFirstName} ${studentLastName},

Your prerequisite waiver request for the course ${classRequest} - ${course_title} has been approved automatically.

Reason: ${autoProcessReason}

You may proceed to enroll in the course.

Best regards,
University Waiver System
        `;
      } else if (status === 'Rejected') {
        // Auto-rejected
        emailSubject = `Prerequisite Waiver Request Rejected: ${course_title}`;
        emailBody = `
Dear ${studentFirstName} ${studentLastName},

Your prerequisite waiver request for the course ${classRequest} - ${course_title} has been automatically rejected.

Reason: ${autoProcessReason}

Please contact your academic advisor for further assistance.

Best regards,
University Waiver System
        `;
      } else {
        // Pending (requires manual review)
        emailSubject = `Prerequisite Waiver Request Submitted: ${course_title}`;
        emailBody = `
Dear ${studentFirstName} ${studentLastName},

Your prerequisite waiver request for the course ${classRequest} - ${course_title} has been submitted and is pending review by your academic advisor.

You will be notified once a decision has been made.

Best regards,
University Waiver System
        `;
      }

      // Send email to student
      try {
        await sendEmail(studentEmail, emailSubject, emailBody);
        logger.info(`Email sent to student (${studentEmail}) regarding request status: ${status}`);
      } catch (emailError) {
        logger.error(`Failed to send email to student (${studentEmail}): ${emailError.message}`);
      }
    } else {
      logger.warn(`No student record found for university_id: ${submitted_by}`);
    }

    // If the request requires manual review, notify the advisor
    if (status === 'Pending' || status === 'Pending with COOP') {
      if (advisor_email) {
        const emailSubject = `New Prerequisite Waiver Request: ${course_title}`;
        const emailBody = `
Dear ${advisorFirstName} ${advisorLastName},

A new prerequisite waiver request has been submitted by the student with University ID: ${submitted_by}.

Details:
- Course Code: ${classRequest}
- Course Title: ${course_title}
- Term Requested: ${term}
- Reason: ${studentReason}
- Detailed Reason: ${detailedReason}
- Senior Design Request: ${seniorDesignRequest ? 'Yes' : 'No'}
- COOP Waiver: ${coopWaiver ? 'Yes' : 'No'}

Please log in to the advisor dashboard to review and process the request.

Best regards,
University Waiver System
        `;

        // Send email to advisor
        try {
          await sendEmail(advisor_email, emailSubject, emailBody);
          logger.info(`Email sent to advisor (${advisor_email}) for manual review.`);
        } catch (emailError) {
          logger.error(`Failed to send email to advisor (${advisor_email}): ${emailError.message}`);
        }
      } else {
        logger.warn(`No advisor email found for advisor of student: ${submitted_by}`);
      }
    }

    // Respond to the client
    res.status(200).json({
      success: true,
      msg: 'Prerequisite waiver request submitted successfully.',
      status,
      autoProcessReason,
    });
  } catch (err) {
    logger.error(`Error submitting waiver request: ${err.message}`, { error: err });
    res.status(500).json({ msg: 'Server error' });
  }
};

export default submitWaiverRequest;




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

