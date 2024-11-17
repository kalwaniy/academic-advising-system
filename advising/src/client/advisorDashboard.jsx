import React, { useEffect, useState } from 'react';
import './styles/index.css';

function AdvisorDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      console.log('Fetching requests with token:', token);
      try {
        const response = await fetch(' http://localhost:5000/api/advisor-dashboard', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          const errorData = await response.json();
          setError(errorData.msg || 'Error fetching requests');
        }
      } catch (err) {
        console.error(err);
        setError('Server error');
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="advisor-dashboard">
      <h1 className="dashboard-title">Advisor Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {requests.length > 0 ? (
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Reason</th>
                <th>Justification</th>
                <th>Term Requested</th>
                <th>Student Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.waiver_id}>
                  <td>{request.request_id}</td>
                  <td>{request.course_code}</td>
                  <td>{request.course_title}</td>
                  <td>{request.reason_to_take}</td>
                  <td>{request.justification}</td>
                  <td>{request.term_requested}</td>
                  <td>{`${request.first_name} ${request.last_name}`}</td>
                  <td>{request.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No requests found</p>
      )}
    </div>
  );
}

export default AdvisorDashboard;
