// src/server/routes/studentroutes.js
import express from 'express';
import db from '../db/db.js'; // Make sure this is pointing to your db connection file

const router = express.Router();

// Define the route to get all data from the `studentsloa` table
router.get('/studentsloa', async (req, res) => {
  try {
    // Execute the query to retrieve all data from the `studentsloa` table
    const [rows] = await db.promise().query('SELECT * FROM studentsloa');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching data from studentsloa:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
