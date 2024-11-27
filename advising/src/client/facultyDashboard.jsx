/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function FacultyDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        setError('Authentication error: No token found. Please log in.');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/faculty/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          const errorData = await response.json();
          setError(errorData.msg || 'Failed to fetch requests. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Network error: Unable to fetch requests. Please check your connection.');
      }
    };

    fetchRequests();
  }, []);

  const openDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };
  

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className="faculty-dashboard">
      <h1 className="dashboard-title">Faculty Dashboard</h1>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.request_id}</td>
                  <td>{request.course_code}</td>
                  <td>{request.course_title}</td>
                  <td>{request.reason_to_take}</td>
                  <td>{request.justification}</td>
                  <td>{request.term_requested}</td>
                  <td>{request.status}</td>
                  <td>
                    <button onClick={() => openDetails(request)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No requests found</p>
      )}

      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Request Details</h2>
            <p><strong>Request ID:</strong> {selectedRequest.request_id}</p>
            <p><strong>Course Code:</strong> {selectedRequest.course_code}</p>
            <p><strong>Course Title:</strong> {selectedRequest.course_title}</p>
            <p><strong>Reason:</strong> {selectedRequest.reason_to_take}</p>
            <p><strong>Justification:</strong> {selectedRequest.justification}</p>
            <p><strong>Term Requested:</strong> {selectedRequest.term_requested}</p>
            <p><strong>Status:</strong> {selectedRequest.status}</p>
            <button onClick={closeModal} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
