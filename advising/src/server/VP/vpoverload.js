import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';

export const getVPOverloadRequests = async (req, res) => {
    try {
      console.log('Fetching VP overload requests for user:', req.user_id);
      
      const query = `
        SELECT 
          co.request_id,
          co.submitted_by as student_id,
          co.semester,
          co.total_credits,
          co.reason,
          co.overload_subjects,
          co.status,
          co.created_at as request_date,
          co.updated_at as last_updated,
          co.reviewed_by as dean_id,
          s.first_name,
          s.last_name,
          s.email_id as student_email,
          d.first_name as dean_first_name,
          d.last_name as dean_last_name,
          d.email_id as dean_email
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        LEFT JOIN dean d ON co.reviewed_by = d.university_id
        WHERE co.status = 'VP Review'
        ORDER BY co.request_id DESC;
      `;
  
      console.log('Executing query:', query);
      const [requests] = await db.query(query);
      console.log('Found requests:', requests.length);
      
      res.status(200).json(requests);
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ 
        success: false,
        msg: 'Server error while fetching requests',
        error: err.message
      });
    }
  };

  export const getVPOverloadRequestDetails = async (req, res) => {
    try {
      const { requestId } = req.params;
  
      const query = `
        SELECT 
          co.request_id,
          co.submitted_by as student_id,
          co.semester,
          co.total_credits,
          co.reason,
          co.overload_subjects,
          co.status,
          co.created_at as request_date,
          co.updated_at as last_updated,
          co.reviewed_by as dean_id,
          s.first_name,
          s.last_name,
          s.email_id as student_email,
          d.first_name as dean_first_name,
          d.last_name as dean_last_name,
          d.email_id as dean_email
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        LEFT JOIN dean d ON co.reviewed_by = d.university_id
        WHERE co.request_id = ?;
      `;
  
      const [rows] = await db.query(query, [requestId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ msg: 'Overload request not found' });
      }
  
      const requestData = rows[0];
  
      // Fetch selected courses
      const coursesQuery = `
        SELECT 
          coc.course_code, 
          c.course_title
        FROM course_overload_courses coc
        JOIN courses c ON coc.course_code = c.course_code
        WHERE coc.request_id = ?;
      `;
      const [courseRows] = await db.query(coursesQuery, [requestId]);
  
      requestData.selectedCourses = courseRows || [];
      res.status(200).json(requestData);
    } catch (err) {
      console.error('Error fetching VP overload request details:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };

// Handle VP decision on overload request
export const handleVPDecision = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const vpId = req.user_id;

  try {
    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    // 1. Update the request status
    const updateQuery = `
      UPDATE course_overloads
      SET status = ?, reviewed_by = ?
      WHERE request_id = ?;
    `;
    const [result] = await db.query(updateQuery, [status, vpId, requestId]);

    if (result.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ msg: 'Request not found' });
    }

    // 2. Get all relevant parties for notifications
    const [details] = await db.query(`
      SELECT 
        co.submitted_by as student_id,
        s.email_id as student_email,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        asr.advisor_id,
        a.email_id as advisor_email,
        a.first_name as advisor_first_name,
        a.last_name as advisor_last_name,
        co.reviewed_by as dean_id,
        d.email_id as dean_email,
        d.first_name as dean_first_name,
        d.last_name as dean_last_name,
        co.semester,
        co.total_credits
      FROM course_overloads co
      JOIN students s ON co.submitted_by = s.university_id
      JOIN advisor_student_relation asr ON s.university_id = asr.student_id
      JOIN academic_advisors a ON asr.advisor_id = a.university_id
      JOIN dean d ON co.reviewed_by = d.university_id
      WHERE co.request_id = ?;
    `, [requestId]);

    if (details.length > 0) {
      const {
        student_id,
        student_email,
        student_first_name,
        student_last_name,
        advisor_id,
        advisor_email,
        advisor_first_name,
        advisor_last_name,
        dean_id,
        dean_email,
        dean_first_name,
        dean_last_name,
        semester,
        total_credits
      } = details[0];

      // 3. Create notification for student
      await db.query(`
        INSERT INTO notifications (user_id, message, is_read, created_at)
        VALUES (?, ?, 0, NOW());
      `, [
        student_id,
        `Your overload request (ID: ${requestId}) has been ${status.toLowerCase()} by the VP`
      ]);

      // 4. Create notification for advisor
      await db.query(`
        INSERT INTO notifications (user_id, message, is_read, created_at)
        VALUES (?, ?, 0, NOW());
      `, [
        advisor_id,
        `Overload request (ID: ${requestId}) has been ${status.toLowerCase()} by the VP`
      ]);

      // 5. Create notification for dean
      await db.query(`
        INSERT INTO notifications (user_id, message, is_read, created_at)
        VALUES (?, ?, 0, NOW());
      `, [
        dean_id,
        `Overload request (ID: ${requestId}) you sent to VP has been ${status.toLowerCase()}`
      ]);

      // 6. Send emails to all parties
      const emailPromises = [];

      // Student email
      const studentEmailSubject = `Course Overload Request ${status}`;
      const studentEmailBody = `
        Dear ${student_first_name} ${student_last_name},

        Your course overload request has been ${status.toLowerCase()} by the Vice President.

        Request Details:
        - Request ID: ${requestId}
        - Semester: ${semester}
        - Total Credits: ${total_credits}
        - Status: ${status}

        You can view the details in your student portal.

        Best regards,
        University Overload System
      `;
      emailPromises.push(sendEmail(student_email, studentEmailSubject, studentEmailBody));

      // Advisor email
      const advisorEmailSubject = `Student Overload Request ${status}`;
      const advisorEmailBody = `
        Dear ${advisor_first_name} ${advisor_last_name},

        The overload request you submitted has been ${status.toLowerCase()} by the Vice President.

        Student: ${student_first_name} ${student_last_name}
        Request ID: ${requestId}
        Semester: ${semester}
        Total Credits: ${total_credits}
        Status: ${status}

        You can view the details in your advisor portal.

        Best regards,
        University Overload System
      `;
      emailPromises.push(sendEmail(advisor_email, advisorEmailSubject, advisorEmailBody));

      // Dean email
      const deanEmailSubject = `Overload Request ${status} by VP`;
      const deanEmailBody = `
        Dear ${dean_first_name} ${dean_last_name},

        The overload request you sent to the Vice President has been ${status.toLowerCase()}.

        Student: ${student_first_name} ${student_last_name}
        Request ID: ${requestId}
        Semester: ${semester}
        Total Credits: ${total_credits}
        Status: ${status}

        Best regards,
        University Overload System
      `;
      emailPromises.push(sendEmail(dean_email, deanEmailSubject, deanEmailBody));

      await Promise.all(emailPromises);
    }

    await db.query('COMMIT');
    res.status(200).json({ msg: `Request ${status.toLowerCase()} successfully` });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error processing VP decision:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
// Get notes for an overload request (VP version)
export const getVPOverloadNotes = async (req, res) => {
  try {
    const { requestId } = req.params;

    const query = `
      SELECT 
        note_id, 
        role, 
        note_text AS content, 
        created_at,
        first_name,
        last_name
      FROM overload_notes
      WHERE request_id = ?
      ORDER BY created_at DESC
    `;
    const [notes] = await db.query(query, [requestId]);

    res.status(200).json({ notes });
  } catch (err) {
    console.error('Error fetching overload notes:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching notes',
      error: err.message
    });
  }
};

// Add note to an overload request (VP version)
export const addVPOverloadNote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user_id;
    const { first_name, last_name } = req.user;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    if (!content) {
      return res.status(400).json({ 
        success: false,
        error: 'Note content is required.' 
      });
    }

    const query = `
      INSERT INTO overload_notes 
        (request_id, user_id, first_name, last_name, role, note_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW());
    `;
    
    const role = 'VP';
    
    const [result] = await db.query(query, [
      requestId, 
      userId, 
      first_name,
      last_name,
      role, 
      content
    ]);

    // Return the newly added note
    const [newNote] = await db.query(`
      SELECT 
        note_id, 
        role, 
        note_text AS content, 
        created_at,
        first_name,
        last_name
      FROM overload_notes
      WHERE note_id = ?
    `, [result.insertId]);

    if (newNote.length === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve newly added note' 
      });
    }

    return res.status(201).json({
      success: true,
      note: newNote[0]
    });
  } catch (err) {
    console.error('Error adding overload note:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Server error while adding note',
      details: err.message
    });
  }
};
  