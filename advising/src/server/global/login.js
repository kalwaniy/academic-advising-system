/* eslint-disable no-undef */
import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const login = async (req, res) => {
  const username = req.body.username?.trim();
  const password = req.body.password?.trim();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const query = `
      SELECT u.user_id, u.username, u.passwd, u.role
      FROM users u
      WHERE u.username = ?;
    `;
    const [users] = await db.query(query, [username]);

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];
    if (user.passwd !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Map database roles to client roles if necessary
    let clientRole = user.role;
    if (user.role === 'dept_chair') {
      clientRole = 'dept_chair';
    }

    // Generate JWT with user details
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: clientRole, // Use the mapped client role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ msg: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
