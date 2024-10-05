/* eslint-disable no-undef */
import db from '../db/db.js'; // Make sure this path is correct

export const getStudentsLOA = async (req, res) => {
  try {
    const students = await db.query('SELECT * FROM studentsloa');
    res.status(200).json(students);
  } catch (err) {
    console.error('Error fetching student data:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
