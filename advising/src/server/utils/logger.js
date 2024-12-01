import { createLogger, transports, format } from 'winston';
import TransportStream from 'winston-transport';
import db from '../db/db.js';

// Custom MySQL transport
class MySQLTransport extends TransportStream {
    log(info, callback) {
        const { level, message, timestamp, role, user_id } = info;

        const query = `
            INSERT INTO logs (level, message, timestamp, role, user_id) VALUES (?, ?, ?, ?, ?);
        `;

        db.execute(query, [level, message, timestamp, role || 'N/A', user_id || 'N/A'])
            .then(() => callback())
            .catch((err) => {
                console.error('Error logging to MySQL:', err.message);
                callback(err); // Pass error to Winston for further handling
            });
    }
}

// Logger instance
const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.printf(
            ({ timestamp, level, message, role, user_id }) =>
                `${timestamp} [${level.toUpperCase()}] [Role: ${role || 'N/A'}] [User ID: ${
                    user_id || 'N/A'
                }]: ${message}`
        )
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'application.log' }),
        new MySQLTransport(), // Custom MySQL transport
    ],
});

// Middleware for logging with extracted role and user_id
export const logWithRequestContext = (req, level, message) => {
    if (!req) {
        console.error('Request object is missing. Unable to log context.');
        return;
    }

    logger.log({
        level,
        message,
        timestamp: new Date().toISOString(),
        role: req.userRole || 'N/A', // Extracted from token or default to 'N/A'
        user_id: req.user_id || 'N/A', // Extracted from token or default to 'N/A'
    });
};

export default logger;
