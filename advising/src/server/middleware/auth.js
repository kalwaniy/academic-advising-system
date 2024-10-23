/* eslint-disable no-undef */
import jwt from 'jsonwebtoken';
import db from '../db/db.js'; 
import 'dotenv/config'; 

const secretKey = process.env.JWT_SECRET;

export const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ msg: 'No token provided' });
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, secretKey);

        // Fetch user information based on the decoded token
        const userQuery = `
            SELECT userID, username, role
            FROM users
            WHERE username = ?
        `;
        const users = await db.query(userQuery, [decoded.username]);

        if (users.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const user = users[0];

        // Attach user information to the request object for later use
        req.currentUser = user;
        req.userID = user.userID;       // Attach userID to the request
        req.userName = decoded.username; // Optionally attach username to request
        req.userRole = user.role;        // Optionally attach user role to request

        next(); // Move to the next middleware or route handler
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(500).json({ msg: 'Failed to authenticate token' });
    }
};
