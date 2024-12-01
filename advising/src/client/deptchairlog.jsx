/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

const DeptChairLog = () => {
  const [logs, setLogs] = useState([]); // State to hold logs
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch logs from the backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token'); // Replace with your token mechanism
        if (!token) {
          setError('Authentication error: No token found.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/department-chair/logs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setLogs(data); // Set logs to the state
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="dept-chair-log">
      <h1>System Logs</h1>
      {loading ? (
        <p>Loading logs...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>
          <p>Error: {error}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Level</th>
                <th>Message</th>
                <th>User ID</th>
                <th>Role</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.level}</td>
                  <td>{log.message}</td>
                  <td>{log.user_id}</td>
                  <td>{log.role}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeptChairLog;
