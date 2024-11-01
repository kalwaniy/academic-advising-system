import express from 'express';
import db from '../db/db.js'; // Ensure correct path to db
import { verifyToken } from '../middleware/auth.js'; // Token verification middleware

const router = express.Router();

// Route to fetch student's first and last name
router.get('/user-info', verifyToken, async (req, res) => {
  try {
    const userId = req.user_id; // Extract user_id from the token
    console.log('User ID from token:', userId);

    // Query to fetch first name and last name from the students table
    const userQuery = `
      SELECT first_name, last_name
      FROM students
      WHERE university_id = ?
    `;
    const [result] = await db.query(userQuery, [userId]);

    // Log the result object to understand its structure
    console.log('Query Result:', result);

    // Check if result is an array and has at least one entry
    if (Array.isArray(result) && result.length > 0) {
      const user = result[0];
      console.log('Fetched User:', user);  // Log the user data

      // Send the first name and last name to the frontend
      return res.json({ firstName: user.first_name, lastName: user.last_name });
    } else {
      console.warn('User not found or incomplete data for ID:', userId);
      return res.status(404).json({ msg: 'User not found or incomplete data' });
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;

