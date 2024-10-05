import express from 'express';
import db from '../db/db.js'; // Assuming your database connection is in `db.js`

const router = express.Router();

// Route to get all data from the `studentsloa` table
router.get('/studentsloa', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM studentsloa'); // Query to get all rows from `studentsloa`
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching data from studentsloa:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
