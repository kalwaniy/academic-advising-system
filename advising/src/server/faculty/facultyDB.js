/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';

export const getFacultyDashboard = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const facultyId = decodedToken.user_id; // Extract faculty ID from token

    // Fetch waiver requests assigned to this faculty member
    const query = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.status
      FROM prerequisite_waivers AS pw
      WHERE pw.status = 'In Review with Facul' AND pw.faculty_id = ?;
    `;

    const [requests] = await db.query(query, [facultyId]);

    if (requests.length === 0) {
      return res.status(404).json({ msg: 'No requests assigned to you.' });
    }

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching Faculty Dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getFacultyRequestNotes = async (req, res) => {
  const { requestId } = req.params;

  try {
    const query = `
      SELECT note_id, user_id, role, note_text, created_at
      FROM request_notes
      WHERE request_id = ?;
    `;
    const [notes] = await db.query(query, [requestId]);

    if (!notes.length) {
      return res.status(404).json({ msg: 'No notes found for this request.' });
    }

    res.status(200).json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Server error while fetching notes.' });
  }
};

export const addFacultyNote = async (req, res) => {
  const { requestId } = req.params;
  const { note_text } = req.body;
  const userId = req.user_id; // Extracted from token via middleware
  const role = 'faculty'; // Hardcoded role for faculty notes

  if (!note_text || !requestId) {
    console.error('Missing required fields:', { note_text, requestId });
    return res.status(400).json({ error: 'Note text and request ID are required.' });
  }

  try {
    const query = `
      INSERT INTO request_notes (request_id, user_id, role, note_text)
      VALUES (?, ?, ?, ?);
    `;
    const [result] = await db.query(query, [requestId, userId, role, note_text]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Failed to add note.' });
    }

    res.status(201).json({ msg: 'Note added successfully.' });
  } catch (err) {
    console.error('Error adding note:', err);
    res.status(500).json({ error: 'Server error while adding note.' });
  }
};


export const completeReview = async (req, res) => {
  const { requestId } = req.params;

  try {
    const query = `
      UPDATE prerequisite_waivers
      SET status = 'In-Review'
      WHERE request_id = ? AND status = 'In Review with Facul';
    `;
    const [result] = await db.query(query, [requestId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Request not found or already updated.' });
    }

    res.status(200).json({ msg: 'Review status updated to "In Review".' });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ error: 'Server error while updating review status.' });
  }
};
