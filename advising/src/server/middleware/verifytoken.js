/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const secretKey = process.env.JWT_SECRET;  // Make sure you have JWT_SECRET in your .env file

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ msg: 'No token provided' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, secretKey);

    // Attach user information to the request object for later use
    req.userID = decoded.id;  // Assuming the token contains 'id'
    req.userName = decoded.username;
    req.userRole = decoded.role;

    next();  // Proceed to the next middleware
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(500).json({ msg: 'Failed to authenticate token' });
  }
};
