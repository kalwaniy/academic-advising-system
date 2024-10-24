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
    // Query to find the user
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username.trim()]);

    if (users.length === 0) {
      console.log('No user found with this username:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Compare plaintext passwords
    const isMatch = user.passwd.trim() === password.trim(); // Adjust if using hashed passwords

    if (!isMatch) {
      console.log('Password does not match for user:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userID: user.userID, username: user.username, role: user.role },
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
