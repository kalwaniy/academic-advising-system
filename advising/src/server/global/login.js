/* eslint-disable no-undef */
import db from '../db/db.js'; // Ensure correct path
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const login = async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Modify query to join the users and students tables
    const query = `
      SELECT u.user_id, u.username, u.passwd, u.role, s.first_name, s.last_name 
      FROM users u
      JOIN students s ON u.user_id = s.university_id
      WHERE u.username = ?
    `;
    const users = await db.query(query, [username.trim()]);

    if (users.length === 0) {
      console.log('No user found with this username:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Compare plaintext passwords (adjust if using hashing)
    const isMatch = user.passwd.trim() === password.trim();

    if (!isMatch) {
      console.log('Password does not match for user:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token with first name and last name
    const token = jwt.sign(
      {
        user_id: user.user_id, // Use the correct user_id
        username: user.username,
        role: user.role,
        firstName: user.first_name,  // Include first name
        lastName: user.last_name,    // Include last name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send the token and user info
    res.status(200).json({ msg: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
