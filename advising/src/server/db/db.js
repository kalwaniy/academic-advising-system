import mysql from 'mysql';
import util from 'util';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'advising'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

// Promisify the query function
db.query = util.promisify(db.query);

export default db;
