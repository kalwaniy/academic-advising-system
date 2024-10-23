/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import db from '../db/db.js'; // Ensure this path is correct

// Function to get student information based on role
export const getStudentsLOA = async (req, res) => {
  try {
    const userID = req.userID;
    const userRole = req.userRole;

    let students;

    // Role-based query
    if (userRole === 'student') {
      const [result] = await db.query(
        `SELECT s.*, sai.program, sai.year_enrolled, sai.CGPA 
        FROM students s
        JOIN student_academic_info sai ON s.university_id = sai.university_id
        WHERE s.university_id = ?`, 
        [userID]
      );
      students = result;
    } else if (userRole === 'advisor') {
      const [result] = await db.query(
        `SELECT s.*, sai.program, sai.year_enrolled, sai.CGPA 
        FROM students s
        JOIN student_academic_info sai ON s.university_id = sai.university_id`
      );
      students = result;
    } else {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.status(200).json(students);
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Function to handle form submission for prerequisite waiver
export const submitWaiverRequest = (req, res) => {
  const { name, email, uid, term, classRequest, reason, detailedReason, seniorDesignRequest, coopRequest } = req.body;
  const jdDocumentPath = req.file ? req.file.path : null;  // Handle file upload path

  console.log('Form data received:', { name, email, uid, term, classRequest, reason, detailedReason, seniorDesignRequest, coopRequest, jdDocumentPath });

  // Insert waiver data into `prerequisite_waivers`
  const insertWaiverQuery = `
    INSERT INTO prerequisite_waivers (course_code, course_title, faculty_id, reason_to_take, justification, senior_design_request, status, term_requested, coop_request, jd_document_path, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?);
  `;

  const courseTitle = 'Sample Course Title';  // Adjust dynamically if needed
  const facultyId = '300000001';  // Example faculty ID
  const seniorDesign = seniorDesignRequest === 'yes' ? 1 : 0;

  db.query(insertWaiverQuery, [classRequest, courseTitle, facultyId, reason, detailedReason, seniorDesign, term, coopRequest, jdDocumentPath, uid], (err, result) => {
    if (err) {
      console.error('Error inserting waiver data:', err);
      return res.status(500).json({ message: 'Error inserting waiver data.' });
    }

    const waiverId = result.insertId;

    // Insert into `student_requests`
    const insertRequestQuery = `
      INSERT INTO student_requests (student_id, submitted_at)
      VALUES (?, NOW());
    `;

    db.query(insertRequestQuery, [uid], (err, requestResult) => {
      if (err) {
        console.error('Error inserting request data:', err);
        return res.status(500).json({ message: 'Error inserting request data.' });
      }

      // Insert notification for faculty
      const insertNotificationQuery = `
        INSERT INTO notifications (waiver_id, recipient_id, recipient_role, message, notification_status)
        VALUES (?, ?, ?, ?, 'Pending');
      `;
      db.query(insertNotificationQuery, [waiverId, facultyId, 'Faculty', 'You have a new waiver request for review.'], (err) => {
        if (err) console.error('Error inserting notification:', err);
      });

      // Log action into `request_history`
      const insertHistoryQuery = `
        INSERT INTO request_history (waiver_id, student_id, action_by, action_by_role, action_taken)
        VALUES (?, ?, ?, ?, 'Submitted');
      `;
      db.query(insertHistoryQuery, [waiverId, uid, uid, 'Student'], (err) => {
        if (err) console.error('Error inserting request history:', err);
      });

      res.status(200).json({ message: 'Form submitted successfully!' });
    });
  });
};