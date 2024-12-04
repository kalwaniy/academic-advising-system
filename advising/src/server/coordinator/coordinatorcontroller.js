import db from '../db/db.js';
import { sendEmail } from '../utils/email.js';

// Get all pending COOP waiver requests
export const getPendingCoopWaiverRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, 
        pw.reason_to_take, pw.justification, pw.term_requested,
        pw.submitted_by, s.first_name, s.last_name, 
        pw.coop_request, pw.senior_design_request
      FROM prerequisite_waivers pw
      JOIN students s ON pw.submitted_by = s.university_id
      WHERE pw.status = 'Pending with COOP';
    `;
    const [rows] = await db.query(query);

    if (!rows.length) {
      return res.status(404).json({ msg: 'No pending COOP waiver requests found.' });
    }

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching pending COOP waiver requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateCoopVerification = async (req, res) => {
  const { requestId } = req.params;
  const { comments, coop1Completed, coop2Completed } = req.body;
  const verifiedBy = req.user_id; // Coordinator's ID from token

  if (!requestId || coop1Completed === undefined || coop2Completed === undefined) {
    return res.status(400).json({ msg: 'Request ID, COOP completion status, and comments are required.' });
  }

  try {
    console.log(`Starting COOP verification for Request ID: ${requestId}`);
    console.log(`COOP1: ${coop1Completed}, COOP2: ${coop2Completed}, Comments: ${comments}`);

    // Insert COOP verification details
    const coopVerificationQuery = `
      INSERT INTO coop_verification (waiver_id, student_id, comments, verified_by)
      SELECT pw.request_id, pw.submitted_by, ?, ?
      FROM prerequisite_waivers pw
      WHERE pw.request_id = ?;
    `;
    await db.query(coopVerificationQuery, [comments, verifiedBy, requestId]);
    console.log('COOP verification details inserted successfully.');

    // Update request status
    const updateStatusQuery = `
      UPDATE prerequisite_waivers
      SET status = 'COOP Review Complete'
      WHERE request_id = ?;
    `;
    const [result] = await db.query(updateStatusQuery, [requestId]);
    console.log(`Update Status Result for Request ID ${requestId}:`, result);

    if (result.affectedRows === 0) {
      console.error(`No rows updated for Request ID: ${requestId}`);
      return res.status(404).json({ msg: 'Waiver request not found or already updated.' });
    }

    res.status(200).json({ msg: 'COOP verification completed successfully.' });
  } catch (err) {
    console.error('Error updating COOP verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

  
  export const notifyAdvisorAfterCoopReview = async (req, res) => {
    const { requestId } = req.params;
  
    try {
      const query = `
        SELECT 
          pw.request_id, s.first_name, s.last_name, 
          aa.email_id AS advisor_email, aa.first_name AS advisor_first_name, aa.last_name AS advisor_last_name
        FROM prerequisite_waivers pw
        JOIN students s ON pw.submitted_by = s.university_id
        JOIN advisor_student_relation ar ON s.university_id = ar.student_id
        JOIN academic_advisors aa ON ar.advisor_id = aa.university_id
        WHERE pw.request_id = ?;
      `;
      const [rows] = await db.query(query, [requestId]);
  
      if (!rows.length) {
        return res.status(404).json({ msg: 'Request or advisor not found.' });
      }
  
      const { advisor_email, advisor_first_name, advisor_last_name, first_name, last_name } = rows[0];
  
      const emailSubject = `COOP Verification Complete for Student: ${first_name} ${last_name}`;
      const emailBody = `
        Dear ${advisor_first_name} ${advisor_last_name},
  
        The COOP verification for the student ${first_name} ${last_name} has been completed.
  
        Please log in to the system to review the updates.
  
        Best regards,
        University COOP Office
      `;
  
      await sendEmail(advisor_email, emailSubject, emailBody);
  
      res.status(200).json({ msg: 'Notification sent to advisor.' });
    } catch (err) {
      console.error('Error notifying advisor:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  export const getCoopVerificationDetails = async (req, res) => {
    const { requestId } = req.params;
  
    try {
      const query = `
        SELECT 
          cv.verification_id, cv.comments, cv.verified_by, cv.verified_at,
          u.first_name AS coordinator_first_name, u.last_name AS coordinator_last_name
        FROM coop_verification cv
        JOIN users u ON cv.verified_by = u.user_id
        WHERE cv.waiver_id = ?;
      `;
      const [rows] = await db.query(query, [requestId]);
  
      if (!rows.length) {
        return res.status(404).json({ msg: 'No verification details found.' });
      }
  
      res.status(200).json({ success: true, data: rows });
    } catch (err) {
      console.error('Error fetching COOP verification details:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };

  // Fetch notes for a specific request (optionally filter by role)
export const getCoordinatorNotes = async (req, res) => {
  const { requestId } = req.params;
  const { role } = req.query; // Optional role filter

  try {
      let query = `
          SELECT note_id, user_id, role, note_text, created_at
          FROM request_notes
          WHERE request_id = ?
      `;

      const queryParams = [requestId];

      if (role) {
          query += ` AND role = ?`;
          queryParams.push(role);
      }

      query += ` ORDER BY created_at DESC`;

      const [notes] = await db.query(query, queryParams);

      if (!notes.length) {
          return res.status(404).json({ msg: 'No notes found for this request.' });
      }

      res.status(200).json(notes);
  } catch (err) {
      console.error('Error fetching coordinator notes:', err);
      res.status(500).json({ error: 'Server error while fetching coordinator notes.' });
  }
};

// Add a note to a specific request
export const addCoordinatorNote = async (req, res) => {
  const { requestId } = req.params;
  const { note_text } = req.body;
  const userId = req.user_id; // Extracted from token via middleware
  const role = 'coordinator'; // Fixed role for coordinator notes

  if (!note_text || !requestId) {
      console.warn('Missing required fields for adding coordinator note.');
      return res.status(400).json({ error: 'Note text and request ID are required.' });
  }

  try {
      const query = `
          INSERT INTO request_notes (request_id, user_id, role, note_text, created_at)
          VALUES (?, ?, ?, ?, NOW());
      `;

      const [result] = await db.query(query, [requestId, userId, role, note_text]);

      if (result.affectedRows === 0) {
          console.error(`Failed to add note for Request ID: ${requestId}`);
          return res.status(500).json({ error: 'Failed to add note.' });
      }

      res.status(201).json({ msg: 'Coordinator note added successfully.' });
  } catch (err) {
      console.error('Error adding coordinator note:', err);
      res.status(500).json({ error: 'Server error while adding coordinator note.' });
  }
};

// Fetch all notes for a specific request
export const getAllNotesByCoordinator = async (req, res) => {
  const { requestId } = req.params;

  try {
      const query = `
          SELECT note_id, user_id, role, note_text, created_at
          FROM request_notes
          WHERE request_id = ?
          ORDER BY created_at DESC;
      `;

      const [notes] = await db.query(query, [requestId]);

      if (!notes.length) {
          return res.status(404).json({ msg: 'No notes found for this request.' });
      }

      res.status(200).json(notes);
  } catch (err) {
      console.error('Error fetching coordinator notes:', err);
      res.status(500).json({ error: 'Server error while fetching coordinator notes.' });
  }
};


// Fetch COOP completion status for a student
export const getCoopCompletionStatus = async (req, res) => {
    const { studentId } = req.params;

    try {
        const query = `
            SELECT coop_course, completed
            FROM coop_status
            WHERE student_id = ?;
        `;
        const [rows] = await db.query(query, [studentId]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'No COOP data found for the student.' });
        }

        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching COOP completion status:', err);
        res.status(500).json({ error: 'Server error while fetching COOP completion status.' });
    }
};

export const updateCoopCompletionStatus = async (req, res) => {
  const { studentId } = req.params;
  const { coopCourse, completed } = req.body;

  if (!studentId || !coopCourse || completed === undefined) {
      return res.status(400).json({ msg: 'Student ID, COOP course, and completion status are required.' });
  }

  try {
      const query = `
          INSERT INTO coop_status (student_id, coop_course, completed)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE completed = ?;
      `;
      await db.query(query, [studentId, coopCourse, completed, completed]);

      res.status(200).json({ msg: 'COOP completion status updated successfully.' });
  } catch (err) {
      console.error('Error updating COOP completion status:', err);
      res.status(500).json({ error: 'Server error while updating COOP completion status.' });
  }
};
