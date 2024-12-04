import db from '../db/db.js';

export const getNotifications = async (req, res) => {
    const userId = req.user_id;

    try {
        const query = `
            SELECT id, message, is_read, created_at 
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC;
        `;
        const [notifications] = await db.query(query, [userId]);
        res.status(200).json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err.message);
        res.status(500).json({ error: 'Server error.' });
    }
};
