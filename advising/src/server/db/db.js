// server/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  multipleStatements: false, // safer default for public code
  ssl: String(process.env.DB_SSL || "false") === "true"
    ? { rejectUnauthorized: false }
    : undefined,
});

// Optional: quick connectivity check (skip in tests)
if (process.env.NODE_ENV !== "test") {
  pool.getConnection()
    .then((conn) => {
      console.log("MySQL connected");
      conn.release();
    })
    .catch((err) => {
      console.error("MySQL connection error:", err.message);
    });
}

export default pool;
