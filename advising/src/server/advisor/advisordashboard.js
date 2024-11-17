// In the route handler for advisor dashboard (server-side)
import db from '../db/db.js';
import jwt from 'jsonwebtoken';

export const getAdvisorDashboard = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decodedToken);

    const userId = decodedToken.user_id;

    const requestsQuery = `
      SELECT 
        waiver_id, request_id, course_code, course_title, faculty_id, 
        reason_to_take, justification, senior_design_request, status, 
        term_requested, coop_request, jd_document_path, submitted_by,
        students.first_name, students.last_name
      FROM prerequisite_waivers 
      JOIN students ON prerequisite_waivers.submitted_by = students.university_id
      WHERE faculty_id = ?
    `;
    
    const [requests] = await db.query(requestsQuery, [userId]);
    console.log('Requests fetched:', requests); // Check the fetched data
    
    if (!requests || requests.length === 0) {
      return res.status(404).json({ msg: 'No pending requests found' });
    }

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error in advisor dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
