import cron from 'node-cron';
import db from './db/db.js'; // Ensure this points to your DB connection

// Schedule the cleanup task
cron.schedule('0 0 * * *', async () => {
  console.log('Running log cleanup task...');
  try {
    const query = `
      DELETE FROM logs
      WHERE timestamp < NOW() - INTERVAL 2 WEEK;
    `;
    const [result] = await db.query(query);
    console.log(`Log cleanup completed. Deleted ${result.affectedRows} logs.`);
  } catch (error) {
    console.error('Error during log cleanup:', error.message);
  }
});
