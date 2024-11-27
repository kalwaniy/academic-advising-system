/* eslint-disable no-unused-vars */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';

export const getFacultyDashboard = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch waiver requests with "In Review with Faculty" status
    const query = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.submitted_by, 
        pw.status
      FROM prerequisite_waivers AS pw
      WHERE pw.status = 'In Review with Facul';
    `;

    const [requests] = await db.query(query);

    if (requests.length === 0) {
      return res.status(404).json({ msg: 'No requests in "In Review with Faculty" status found' });
    }

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching Faculty Dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


