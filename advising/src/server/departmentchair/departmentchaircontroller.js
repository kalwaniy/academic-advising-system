import db from '../db/db.js';

export const getDepartmentChairUserInfo = async (req, res) => {
  try {
    // Extract user_id from the token via middleware
    const departmentChairId = req.user_id; 
    console.log('Fetching user info for Department Chair:', departmentChairId);

    // SQL query to fetch department chair details
    const query = `
      SELECT first_name, last_name
      FROM department_chairs
      WHERE university_id = ?;
    `;

    // Execute query
    const [result] = await db.query(query, [departmentChairId]);

    // Handle case where no result is found
    if (!result.length) {
      console.warn(`No department chair found for ID: ${departmentChairId}`);
      return res.status(404).json({ msg: 'Department Chair not found' });
    }

    // Extract data and send response
    const { first_name, last_name } = result[0];
    res.status(200).json({ firstName: first_name, lastName: last_name });
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching department chair info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
