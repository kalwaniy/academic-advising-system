import db from '../db/db.js';

export const getFacultyUserInfo = async (req, res) => {
  try {
    // Extract user_id from the token via middleware
    const facultyId = req.user_id; 
    console.log('Fetching user info for Faculty:', facultyId);

    // SQL query to fetch faculty details
    const query = `
      SELECT first_name, last_name
      FROM faculty
      WHERE university_id = ?;
    `;

    // Execute query
    const [result] = await db.query(query, [facultyId]);

    // Handle case where no result is found
    if (!result.length) {
      console.warn(`No faculty found for ID: ${facultyId}`);
      return res.status(404).json({ msg: 'Faculty member not found' });
    }

    // Extract data and send response
    const { first_name, last_name } = result[0];
    res.status(200).json({ firstName: first_name, lastName: last_name });
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching faculty info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
