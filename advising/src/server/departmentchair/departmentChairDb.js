import db from '../db/db.js';
import jwt from 'jsonwebtoken';

export const getDeptChairDashboard = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch waiver requests with "In-Review" status
    const query = `
      SELECT 
        pw.request_id, pw.course_code, pw.course_title, pw.reason_to_take, 
        pw.justification, pw.term_requested, pw.submitted_by, 
        s.first_name, s.last_name, pw.status
      FROM prerequisite_waivers AS pw
      JOIN students AS s ON pw.submitted_by = s.university_id
      WHERE pw.status = 'In-Review';
    `;

    const [requests] = await db.query(query);

    if (requests.length === 0) {
      return res.status(404).json({ msg: 'No requests in "In-Review" status found' });
    }

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching Dept Chair Dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStudentDetails = async (req, res) => {
    const { studentId } = req.params;
  
    try {
      // Updated query to fetch all required student information
      const studentQuery = `
        SELECT 
          s.university_id, s.first_name, s.last_name, s.email_id, 
          a.CGPA AS cgpa, a.program, a.year_level, a.year_enrolled, a.current_semester_year AS current_term
        FROM students s
        JOIN student_academic_info a ON s.university_id = a.university_id
        WHERE s.university_id = ?;
      `;
      const [studentRows] = await db.query(studentQuery, [studentId]);
  
      if (studentRows.length === 0) {
        return res.status(404).json({ msg: 'Student not found' });
      }
  
      const studentData = studentRows[0];
  
      // Fetch course log with grades
      const courseLogQuery = `
        SELECT sc.course_code, c.course_title, sc.term_taken, sc.grade
        FROM student_courses sc
        JOIN courses c ON sc.course_code = c.course_code
        WHERE sc.student_id = ?;
      `;
      const [courseLogRows] = await db.query(courseLogQuery, [studentId]);
  
      // Attach course log data to the studentData object
      studentData.courseLog = courseLogRows;
  
      console.log('Fetched Student Details:', studentData);
  
      res.status(200).json(studentData);
    } catch (err) {
      console.error('Error fetching student details:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };