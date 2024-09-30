import db from '../db/db.js'; // Make sure the path is correct
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      console.log('No user found with this username:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];
    console.log('Stored Password:', user.passwd); // Log the stored password

    const isMatch = password === user.passwd; // Compare directly
    console.log('Password match:', isMatch); // Check the match status

    if (!isMatch) {
      console.log('Password does not match for user:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userID: user.userID, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ msg: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
