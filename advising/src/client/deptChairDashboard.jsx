/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function DeptChairDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        setError('Authentication error: No token found. Please log in.');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/department-chair/dashboard', {
          headers: { Authorization: `Bearer ${token}`},
        });

        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          const errorData = await response.json();
          console.error('Error fetching requests:', errorData);
          setError(errorData.msg || 'Failed to fetch requests. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Network error: Unable to fetch requests. Please check your connection.');
      }
    };

    // Fetch requests on component load
    fetchRequests();
  }, []);

  const fetchStudentDetails = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/student-details/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentDetails(data);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        console.error('Error fetching student details:', errorData);
        setError(errorData.msg || 'Error fetching student details');
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Server error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setStudentDetails(null);
  };

  return (
    <div className="dept-chair-dashboard">
      <h1 className="dashboard-title">Department Chair Dashboard</h1>
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
                  <td>{`${request.first_name} ${request.last_name}`}</td>
                  <td>{request.status}</td>
                  <td>
                  <button onClick={() => fetchStudentDetails(request.submitted_by)}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No requests found</p>
      )}

      {/* Modal for Viewing Student Details */}
      {showModal && studentDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Student Details</h2>
            <p>
  <strong>Name:</strong> {`${studentDetails.first_name} ${studentDetails.last_name}`}
</p>

            <p><strong>Email:</strong> {studentDetails.email_id}</p>
            <p><strong>CGPA:</strong> {studentDetails.cgpa}</p>
            <p><strong>Program:</strong> {studentDetails.program}</p>
            <p><strong>Year Level:</strong> {studentDetails.year_level}</p>
            <p><strong>Term Enrolled:</strong> {studentDetails.year_enrolled}</p>
            <p><strong>Current Term:</strong> {studentDetails.current_term}</p>

            <h3>Course Log</h3>
            <table className="course-log-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Term Taken</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentDetails.courseLog.map((course) => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>{course.term_taken}</td>
                    <td>{course.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeptChairDashboard;