// db.js
const mysql = require('mysql');
const util = require('util');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'advising'
});

db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

// Promisify the query function
db.query = util.promisify(db.query);

module.exports = db;
