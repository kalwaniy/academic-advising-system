import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';


// Get all overload requests with "Dean Review" status
export const getDeanOverloadRequests = async (req, res) => {
    try {
      const query = `
        SELECT 
          co.request_id,
          co.submitted_by,
          co.semester,
          co.total_credits,
          co.reason,
          co.overload_subjects,
          co.status,
          s.first_name,
          s.last_name
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        WHERE co.status = 'Dean Review'
        ORDER BY co.request_id DESC;
      `;
  
      const [requests] = await db.query(query);
      res.status(200).json(requests);
    } catch (err) {
      console.error('Error fetching dean overload requests:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  // Get details of a specific overload request
  export const getDeanOverloadRequestDetails = async (req, res) => {
    try {
      const { requestId } = req.params;
  
      // 1. Basic info from course_overloads
      const query = `
        SELECT 
          co.request_id, 
          co.submitted_by,
          co.semester,
          co.total_credits,
          co.reason,
          co.overload_subjects,
          co.status,
          s.first_name,
          s.last_name
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        WHERE co.request_id = ?;
      `;
      const [rows] = await db.query(query, [requestId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ msg: 'Overload request not found' });
      }
  
      const requestData = rows[0];
  
      // 2. Fetch selected courses
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
      console.error('Error fetching overload request details:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  


  // Get notes for an overload request
export const getOverloadNotes = async (req, res) => {
    try {
      const { requestId } = req.params;
  
      const query = `
        SELECT 
          note_id, 
          note_text AS content, 
          created_at, 
          role, 
          user_id
        FROM overload_notes
        WHERE request_id = ?
        ORDER BY created_at DESC
      `;
      const [notes] = await db.query(query, [requestId]);
  
      res.status(200).json({ notes });
    } catch (err) {
      console.error('Error fetching overload notes:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  export const addOverloadNote = async (req, res) => {
    try {
      const { requestId } = req.params;
      const { content } = req.body;
      const userId = req.user_id; // Make sure this is coming from your authentication middleware
  
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      if (!content) {
        return res.status(400).json({ error: 'Note content is required.' });
      }
  
      const query = `
        INSERT INTO overload_notes (request_id, user_id, first_name, last_name, role, note_text, created_at)
        VALUES (?, ?, ?, ?, NOW());
      `;
      
      // Assuming the dean's role is 'Dean' - adjust if needed
      const role = 'Dean';
      
      const [result] = await db.query(query, [
        requestId, 
        userId, 
        role, 
        content
      ]);
  
      // Return the newly added note
      const [newNote] = await db.query(`
        SELECT 
          note_id, 
          note_text AS content, 
          created_at, 
          role, 
          user_id
        FROM overload_notes
        WHERE note_id = ?
      `, [result.insertId]);
  
      if (newNote.length === 0) {
        return res.status(500).json({ error: 'Failed to retrieve newly added note' });
      }
  
      return res.status(201).json(newNote[0]);
    } catch (err) {
      console.error('Error adding overload note:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  export const handleDeanDecision = async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;
  
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
        SET status = ?
        WHERE request_id = ?;
      `;
      const [result] = await db.query(updateQuery, [status, requestId]);
  
      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ msg: 'Request not found' });
      }
  
      // 2. Get student and advisor details for notifications
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
          co.semester,
          co.total_credits
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        JOIN advisor_student_relation asr ON s.university_id = asr.student_id
        JOIN academic_advisors a ON asr.advisor_id = a.university_id
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
          semester,
          total_credits
        } = details[0];
  
        // 3. Create notification for student
        await db.query(`
          INSERT INTO notifications (user_id, message, is_read, created_at)
          VALUES (?, ?, 0, NOW());
        `, [
          student_id,
          `Your overload request (ID: ${requestId}) has been ${status.toLowerCase()} by the Dean`
        ]);
  
        // 4. Create notification for advisor
        await db.query(`
          INSERT INTO notifications (user_id, message, is_read, created_at)
          VALUES (?, ?, 0, NOW());
        `, [
          advisor_id,
          `Overload request (ID: ${requestId}) you submitted to Dean has been ${status.toLowerCase()}`
        ]);
  
        // 5. Send email to student
        const studentEmailSubject = `Course Overload Request ${status}`;
        const studentEmailBody = `
          Dear ${student_first_name} ${student_last_name},
  
          Your course overload request has been ${status.toLowerCase()} by the Dean.
  
          Request Details:
          - Request ID: ${requestId}
          - Semester: ${semester}
          - Total Credits: ${total_credits}
          - Status: ${status}
  
          You can view the details in your student portal.
  
          Best regards,
          University Overload System
        `;
  
        // 6. Send email to advisor
        const advisorEmailSubject = `Student Overload Request ${status}`;
        const advisorEmailBody = `
          Dear ${advisor_first_name} ${advisor_last_name},
  
          The overload request you submitted to the Dean has been ${status.toLowerCase()}.
  
          Student: ${student_first_name} ${student_last_name}
          Request ID: ${requestId}
          Semester: ${semester}
          Total Credits: ${total_credits}
          Status: ${status}
  
          You can view the details in your advisor portal.
  
          Best regards,
          University Overload System
        `;
  
        // Send emails (run in parallel)
        await Promise.all([
          sendEmail(student_email, studentEmailSubject, studentEmailBody),
          sendEmail(advisor_email, advisorEmailSubject, advisorEmailBody)
        ]);
      }
  
      await db.query('COMMIT');
      res.status(200).json({ msg: `Request ${status.toLowerCase()} successfully` });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Error processing dean decision:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };



  export const sendToVP = async (req, res) => {
    const { requestId } = req.params;
    const deanId = req.user_id;
  
    // Validate requestId
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid request ID' 
      });
    }
  
    try {
      // 1. Verify request exists and is in Dean Review status
      const verifyQuery = `
        SELECT 
          co.request_id, 
          co.status, 
          co.semester,
          co.total_credits,
          co.reason,
          s.university_id as student_id,
          s.first_name, 
          s.last_name, 
          s.email_id,
          d.first_name as dean_first_name,
          d.last_name as dean_last_name
        FROM course_overloads co
        JOIN students s ON co.submitted_by = s.university_id
        JOIN dean d ON d.university_id = ?
        WHERE co.request_id = ? AND co.status = 'Dean Review';
      `;
      const [results] = await db.query(verifyQuery, [deanId, requestId]);
  
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false,
          msg: 'Request not found or not in correct status for VP review' 
        });
      }
  
      const request = results[0];
  
      // 2. Check if already with VP
      if (request.status === 'VP Review') {
        return res.status(400).json({ 
          success: false,
          msg: 'Request is already with the VP' 
        });
      }
  
      // Start transaction
      await db.query('START TRANSACTION');
  
      // 3. Update status to "VP Review"
      await db.query(
        `UPDATE course_overloads SET status = 'VP Review' WHERE request_id = ?`,
        [requestId]
      );
  
      // 4. Get any VP
      const [vp] = await db.query(`
        SELECT university_id, email_id, first_name, last_name 
        FROM vice_president 
        LIMIT 1;
      `);
  
      if (vp.length > 0) {
        const vpInfo = vp[0];
  
        // 5. Create notification for VP
        await db.query(
          `INSERT INTO notifications (user_id, message, is_read, created_at)
           VALUES (?, ?, 0, NOW())`,
          [
            vpInfo.university_id, 
            `Overload request (ID: ${requestId}) from ${request.first_name} ${request.last_name} needs VP review`
          ]
        );
  
        // 6. Send email to VP
        const emailSubject = `Overload Request for VP Review (ID: ${requestId})`;
        const emailBody = `
          Dear ${vpInfo.first_name} ${vpInfo.last_name},
  
          A course overload request has been forwarded to you for review.
  
          Current Status: ${request.status}
          Student: ${request.first_name} ${request.last_name}
          Student ID: ${request.student_id}
          Email: ${request.email_id}
          Reviewed by Dean: ${request.dean_first_name} ${request.dean_last_name}
          
          Request Details:
          - Request ID: ${requestId}
          - Semester: ${request.semester}
          - Total Credits: ${request.total_credits}
          - Reason: ${request.reason}
  
          Please log in to the system to review this request.
  
          Best regards,
          University Overload System
        `;
  
        await sendEmail(vpInfo.email_id, emailSubject, emailBody);
      }
  
      await db.query('COMMIT');
      res.status(200).json({ 
        success: true,
        msg: 'Request sent to VP successfully',
        newStatus: 'VP Review'
      });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Error sending to VP:', err);
      res.status(500).json({ 
        success: false,
        msg: 'Server error while processing request',
        error: err.message
      });
    }
  };