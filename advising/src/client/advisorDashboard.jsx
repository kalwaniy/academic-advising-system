/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function AdvisorDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [courseData, setCourseData] = useState([]); // Holds available course codes and titles
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            setError('Authentication error: No token found. Please log in.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/advisor/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
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

    const fetchCourseData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            setError('Authentication error: No token found. Please log in.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/advisor/courses', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCourseData(data);
            } else {
                const errorData = await response.text();
                console.error(`Error fetching course data: ${errorData}`);
                setError('Failed to fetch course data. Please try again.');
            }
        } catch (err) {
            console.error('Error fetching course data:', err);
            setError('Network error: Unable to fetch course data. Please check your connection.');
        }
    };

    // Fetch data
    fetchRequests();
    fetchCourseData();
}, []);


  const fetchStudentDetails = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/student-details/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentDetails(data);
        setShowModal(true);
      } else {
        console.error('Error fetching student details');
        const errorData = await response.json();
        setError(errorData.msg || 'Error fetching student details');
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Server error');
    }
  };

  const handleEditRequest = (request) => {
    setCurrentRequest(request);
    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/update-request/${currentRequest.request_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRequest),
      });

      if (response.ok) {
        alert('Request updated successfully!');
        setEditModalVisible(false);
        // Refresh the requests list
        setRequests((prev) =>
          prev.map((req) => (req.request_id === currentRequest.request_id ? currentRequest : req))
        );
      } else {
        alert('Error updating request');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Server error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setStudentDetails(null);
  };

  const handleCourseCodeChange = (code) => {
    const selectedCourse = courseData.find((course) => course.course_code === code);
    setCurrentRequest((prev) => ({
      ...prev,
      course_code: code,
      course_title: selectedCourse ? selectedCourse.course_title : '',
    }));
  };

  const handleCourseTitleChange = (title) => {
    const selectedCourse = courseData.find((course) => course.course_title === title);
    setCurrentRequest((prev) => ({
      ...prev,
      course_code: selectedCourse ? selectedCourse.course_code : '',
      course_title: title,
    }));
  };

  const openNotesModal = async (requestId) => {
    setSelectedRequestId(requestId);
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/notes/${requestId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData[0]?.content || ''); // Handle existing notes
      } else {
        setNotes('');
        console.error('API returned error:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
    setShowModal(true);
  };
  
  const saveNotes = async () => {
    const token = localStorage.getItem('token');
    console.log('Authorization token:', token);
  
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/notes/${selectedRequestId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: notes, // Ensure this matches the expected backend input
        }),
      });
  
      if (response.ok) {
        alert('Note saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('API returned error:', errorData);
        alert(`Failed to save note. Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note.');
    }
  };
  
  

  return (
    <div className="advisor-dashboard">
      <h1 className="dashboard-title">Pre-requisite Waiver Requests</h1>
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
                    <button onClick={() => handleEditRequest(request)}>Edit</button>
                    <button 
                            onClick={() => openNotesModal(request.request_id)} 
                            className="btn btn-primary"
                            >
                            Edit/View Notes
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

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Edit/View Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="10"
                cols="50"
              />
              <button onClick={saveNotes} className="btn btn-success">
                Save
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
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

      {/* Modal for Editing Request */}
      {editModalVisible && currentRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Request</h2>
            <form>
              <label>
                Course Code:
                <select
                  value={currentRequest.course_code}
                  onChange={(e) => handleCourseCodeChange(e.target.value)}
                >
                  <option value="" disabled>Select a course code</option>
                  {courseData.map((course) => (
                    <option key={course.course_code} value={course.course_code}>
                      {course.course_code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Course Title:
                <select
                  value={currentRequest.course_title}
                  onChange={(e) => handleCourseTitleChange(e.target.value)}
                >
                  <option value="" disabled>Select a course title</option>
                  {courseData.map((course) => (
                    <option key={course.course_title} value={course.course_title}>
                      {course.course_title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reason:
                <textarea
                  value={currentRequest.reason_to_take}
                  onChange={(e) =>
                    setCurrentRequest({ ...currentRequest, reason_to_take: e.target.value })
                  }
                />
              </label>
              <label>
                Justification:
                <textarea
                  value={currentRequest.justification}
                  onChange={(e) =>
                    setCurrentRequest({ ...currentRequest, justification: e.target.value })
                  }
                />
              </label>
              <label>
                Term Requested:
                <input
                  type="text"
                  value={currentRequest.term_requested}
                  onChange={(e) =>
                    setCurrentRequest({ ...currentRequest, term_requested: e.target.value })
                  }
                />
              </label>
              <label>
                Status:
                <select
                  value={currentRequest.status}
                  onChange={(e) =>
                    setCurrentRequest({ ...currentRequest, status: e.target.value })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
            </form>
            <button onClick={handleSaveChanges}>Save Changes</button>
            <button onClick={() => setEditModalVisible(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorDashboard;
