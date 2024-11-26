/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import db from '../db/db.js';
import 'dotenv/config';

const secretKey = process.env.JWT_SECRET;

export const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) {
    console.warn('No token provided in request headers');
    return res.status(403).json({ msg: 'No token provided' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, secretKey);
    console.log('Decoded token:', decoded);

    // Check if `user_id` exists in the token or fetch it from the database
    if (!decoded.user_id && decoded.username) {
      const userQuery = `
        SELECT user_id, username, role
        FROM users
        WHERE username = ?
      `;
      
      const [users] = await db.query(userQuery, [decoded.username]);

      if (users.length === 0) {
        console.warn(`User with username ${decoded.username} not found`);
        return res.status(404).json({ msg: 'User not found' });
      }

      const user = users[0];
      console.log('User found in database:', user);

      req.user_id = user.user_id;
      req.currentUser = user;
    } else {
      req.user_id = decoded.user_id;
    }

    // Attach other token properties
    req.userName = decoded.username;
    req.userRole = decoded.role;

    console.log('Final attached User ID:', req.user_id);

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Token verification error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token has expired' });
    }

    return res.status(500).json({ msg: 'Failed to authenticate token' });
  }
};
