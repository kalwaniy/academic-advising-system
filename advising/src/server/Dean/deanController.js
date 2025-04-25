import db from '../db/db.js';

export const getDeanUserInfo = async (req, res) => {
  try {
    const deanId = req.user_id;
    console.log('Fetching user info for Dean:', deanId);

    const query = `
      SELECT first_name, last_name 
      FROM dean 
      WHERE university_id = ?;
    `;

    const [result] = await db.query(query, [deanId]);

    if (!result.length) {
      console.warn(`No Dean found for ID: ${deanId}`);
      return res.status(404).json({ msg: 'Dean not found' });
    }

    const { first_name, last_name } = result[0];
    res.status(200).json({ firstName: first_name, lastName: last_name });

  } catch (error) {
    console.error('Error fetching Dean info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

