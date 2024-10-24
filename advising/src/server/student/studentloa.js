import db from '../db/db.js';

// Function to get student data from 'students' and 'student_academic_info' tables
export const getStudentData = async (req, res) => {
  try {
    const userID = req.userID; // Assuming userID is attached to the request from the token

    // Query to get student personal data from 'students' table
    const studentQuery = `
      SELECT s.university_id, s.first_name, s.last_name, s.email_id, a.CGPA
      FROM students AS s
      JOIN student_academic_info AS a ON s.university_id = a.university_id
      WHERE s.university_id = ?
    `;
    const [studentData] = await db.query(studentQuery, [userID]);

    if (!studentData) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.status(200).json(studentData);
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Function to submit a prerequisite waiver request
export const submitWaiverRequest = async (req, res) => {
  const { uid, name, email, cgpa, term, classRequest, reason, detailedReason, seniorDesignRequest, coopWaiver } = req.body;

  try {
    // Insert waiver request into the 'waivers' table (create the table if necessary)
    const waiverQuery = `
      INSERT INTO waivers (university_id, name, email, cgpa, term, class_requested, reason, detailed_reason, senior_design_request, coop_waiver)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(waiverQuery, [uid, name, email, cgpa, term, classRequest, reason, detailedReason, seniorDesignRequest, coopWaiver]);

    res.status(200).json({ success: true, msg: 'Prerequisite waiver request submitted successfully!' });
  } catch (err) {
    console.error('Error submitting waiver request:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};