/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';
import { evaluateAutoProcessing } from '../utils/autoProcessingRules.js';
import { evaluateOverloadAutoProcessing } from '../utils/evaluateOverloadAutoProcessing.js';
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
  const {
    classRequest,
    reason: studentReason,
    detailedReason,
    term,
    submitted_by,
  } = req.body;

  const seniorDesignRequest = req.body.seniorDesignRequest ? parseInt(req.body.seniorDesignRequest, 10) : 0;
  const coopWaiver = req.body.coopWaiver ? parseInt(req.body.coopWaiver, 10) : 0;

  if (!classRequest || !studentReason || !submitted_by) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    const [courseRows] = await db.query('SELECT course_title FROM courses WHERE course_code = ?', [classRequest]);

    if (!courseRows.length) {
      logger.warn(`No course found for code: ${classRequest}`);
      return res.status(400).json({ msg: 'Course not found.' });
    }

    const course_title = courseRows[0].course_title;

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

    const request = { course_code: classRequest, submitted_by };
    const evaluationResult = await evaluateAutoProcessing(request);

    let status = 'Pending';
    let autoProcessReason = '';
    if (evaluationResult && evaluationResult.status) {
      status = evaluationResult.status;
      autoProcessReason = evaluationResult.reason || '';
    }

    const auto_processed = status === 'Approved' || status === 'Rejected' ? 1 : 0;

    if (coopWaiver === 1) {
      status = 'Pending with COOP';
    }

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

    const studentEmailQuery = 'SELECT email_id, first_name, last_name FROM students WHERE university_id = ?';
    const [studentRows] = await db.query(studentEmailQuery, [submitted_by]);

    if (studentRows.length) {
      const { email_id: studentEmail, first_name: studentFirstName, last_name: studentLastName } = studentRows[0];

      let emailSubject = '';
      let emailBody = '';

      if (status === 'Approved') {
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
        emailSubject = `Prerequisite Waiver Request Submitted: ${course_title}`;
        emailBody = `
          Dear ${studentFirstName} ${studentLastName},

          Your prerequisite waiver request for the course ${classRequest} - ${course_title} has been submitted and is pending review by your academic advisor.

          You will be notified once a decision has been made.

          Best regards,
          University Waiver System
        `;
      }

      try {
        await sendEmail(studentEmail, emailSubject, emailBody);
        logger.info(`Email sent to student (${studentEmail}) regarding request status: ${status}`);
      } catch (emailError) {
        logger.error(`Failed to send email to student (${studentEmail}): ${emailError.message}`);
      }
    } else {
      logger.warn(`No student record found for university_id: ${submitted_by}`);
    }

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

      try {
        await sendEmail(advisor_email, emailSubject, emailBody);
        logger.info(`Email sent to advisor (${advisor_email}) for manual review.`);
      } catch (emailError) {
        logger.error(`Failed to send email to advisor (${advisor_email}): ${emailError.message}`);
      }
    } else {
      logger.warn(`No advisor email found for advisor of student: ${submitted_by}`);
    }

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





// Example in getCourses
const getCourses = async (req, res) => {
  try {
    const query = `
      SELECT course_code, course_title, credits
      FROM courses
      ORDER BY course_code;
    `;
    const [rows] = await db.query(query);

    if (!rows.length) {
      return res.status(404).json({ msg: 'No courses found' });
    }

    // Return the rows, which now include credits
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



const submitCourseOverloadRequest = async (req, res) => {
  try {
    console.log('Inside submitCourseOverloadRequest...');
    const {
      submitted_by,
      semester,
      total_credits,
      reason,
      overload_subjects // <-- new field from req.body
    } = req.body;

    // 'selected_courses' is the JSON string array, e.g. '["CSCI141","ISTE200"]'
    let selectedCourses = [];
    if (req.body.selected_courses) {
      selectedCourses = JSON.parse(req.body.selected_courses);
    }

    // Basic validation
    if (!submitted_by || !semester || !reason || !total_credits) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields: submitted_by, semester, reason, or total_credits.'
      });
    }

    // 1. Evaluate auto-processing criteria (assuming you imported evaluateOverloadAutoProcessing)
    const evaluationResult = await evaluateOverloadAutoProcessing({
      submitted_by,
      total_credits
    });

    let status = 'Pending';      
    let autoProcessReason = '';  

    if (evaluationResult.status === 'Rejected') {
      status = 'Rejected';
      autoProcessReason = evaluationResult.reason;
    } else if (evaluationResult.status === 'Error') {
      return res.status(400).json({
        success: false,
        msg: `Auto-processing error: ${evaluationResult.reason}`
      });
    }

    console.log(`Auto-processing => status: ${status}, reason: ${autoProcessReason}`);

    // Insert into course_overloads, also storing overload_subjects
    const insertOverloadSql = `
      INSERT INTO course_overloads (
        submitted_by,
        semester,
        total_credits,
        reason,
        overload_subjects,   -- new column
        status,
        auto_process_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [overloadResult] = await db.query(insertOverloadSql, [
      submitted_by,
      semester,
      parseInt(total_credits, 10),
      reason,
      overload_subjects, // storing new field
      status,
      autoProcessReason
    ]);

    const newRequestId = overloadResult.insertId;
    logger.info(`New overload ID: ${newRequestId}, status: ${status}`);

    // Insert the chosen courses
    const insertCoursesSql = `
      INSERT INTO course_overload_courses (request_id, course_code)
      VALUES (?, ?)
    `;
    for (const courseCode of selectedCourses) {
      await db.query(insertCoursesSql, [newRequestId, courseCode]);
      logger.info(`Inserted course ${courseCode} for Overload ID: ${newRequestId}`);
    }

    // 4. Optionally send an email to the student
    const [studentRows] = await db.query(
      `SELECT email_id, first_name, last_name FROM students WHERE university_id = ?`,
      [submitted_by]
    );

    if (studentRows.length) {
      const { email_id: studentEmail, first_name, last_name } = studentRows[0];

      try {
        const subject = `Course Overload Request ${status === 'Rejected' ? 'Rejected' : 'Submitted'}`;
        let emailBody = `
          Dear ${first_name} ${last_name},

          Your course overload request for the ${semester} semester has been received.
          Total Credits: ${total_credits}
          Reason: ${reason}
        `;

        if (status === 'Rejected') {
          emailBody += `\n\nWe regret to inform you that it has been automatically rejected due to:\n${autoProcessReason}\n`;
        } else {
          emailBody += '\n\nWe will review your request and notify you once a decision is made.\n';
        }

        emailBody += '\nBest regards,\nUniversity Overload System';

        await sendEmail(studentEmail, subject, emailBody);
        logger.info(`Email sent to student (${studentEmail}) for Overload Request ID: ${newRequestId}, status: ${status}`);
      } catch (emailError) {
        logger.error(`Failed to send Overload email to student (${studentEmail}): ${emailError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      msg: `Course overload request submitted. Current status: ${status}`,
      request_id: newRequestId
    });

  } catch (err) {
    console.error('Error in submitCourseOverloadRequest:', err);
    logger.error(`Error submitting course overload request: ${err.message}`, { error: err });
    return res.status(500).json({
      success: false,
      msg: 'Server error submitting course overload request.'
    });
  }
};


// Export all functions as named exports
export { getStudentData, submitWaiverRequest, getCourses, submitCourseOverloadRequest }; 