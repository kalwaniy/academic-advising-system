import db from '../db/db.js';

export const getVPUserInfo = async (req, res) => {
  try {
    // Extract user_id from the token via middleware
    const vpId = req.user_id;
    console.log('Fetching user info for VP:', vpId);

    // SQL query to fetch VP details
    const query = `
      SELECT first_name, last_name
      FROM vice_president
      WHERE university_id = ?;
    `;

    // Execute query
    const [result] = await db.query(query, [vpId]);

    // Handle case where no result is found
    if (!result.length) {
      console.warn(`No VP found for ID: ${vpId}`);
      return res.status(404).json({ msg: 'Vice President not found' });
    }

    // Extract data and send response
    const { first_name, last_name } = result[0];
    res.status(200).json({ firstName: first_name, lastName: last_name });
  } catch (error) {
    console.error('Error fetching VP info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
