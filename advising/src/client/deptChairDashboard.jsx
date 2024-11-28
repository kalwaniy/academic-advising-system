/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function DeptChairDashboard() {
  const [requests, setRequests] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]); // Faculty members list
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [latestAdvisorNote, setLatestAdvisorNote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pastCourses, setPastCourses] = useState([]);
  const [deptChairNote, setDeptChairNote] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  // Fetch requests and faculty members
  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication error: No token found.');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/department-chair/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests);
          setFacultyMembers(data.facultyMembers);
        } else {
          const errorData = await response.json();
          setError(errorData.msg || 'Failed to fetch requests.');
        }
      } catch (err) {
        setError('Network error: Unable to fetch requests.');
      }
    };

    fetchRequests();
  }, []);

  const fetchStudentDetails = async (studentId, requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/student-details/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentDetails(data);
        setSelectedRequestId(requestId);
        await fetchPastCourses(studentId);
        await fetchLatestAdvisorNote(requestId);
        await fetchDeptChairNote(requestId);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error fetching student details.');
      }
    } catch (err) {
      setError('Server error: Unable to fetch student details.');
    }
  };

  const fetchPastCourses = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/student-past-courses/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const courses = await response.json();
        setPastCourses(courses);
      } else {
        setPastCourses([]);
      }
    } catch (err) {
      setPastCourses([]);
    }
  };

  const fetchLatestAdvisorNote = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/latest-advisor-note/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const note = await response.json();
        setLatestAdvisorNote(note.note_text || 'No advisor notes available.');
      } else {
        setLatestAdvisorNote('No advisor notes found.');
      }
    } catch (err) {
      setLatestAdvisorNote('Error fetching advisor note.');
    }
  };

  const fetchDeptChairNote = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/dept-chair-note/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const note = await response.json();
        setDeptChairNote(note.note_text || 'No department chair notes available.');
      } else {
        setDeptChairNote('No department chair notes found.');
      }
    } catch (err) {
      setDeptChairNote('Error fetching department chair note.');
    }
  };

  const addNote = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/notes/${selectedRequestId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note_text: newNote }),
      });

      if (response.ok) {
        alert('Note added successfully!');
        setNewNote('');
        fetchLatestAdvisorNote(selectedRequestId);
      } else {
        alert('Failed to add note.');
      }
    } catch (err) {
      alert('Server error while adding note.');
    }
  };

  const sendToFaculty = async (requestId, facultyId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/department-chair/send-to-faculty/${requestId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facultyId }),
      });

      if (response.ok) {
        alert('Request sent to faculty successfully!');
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.request_id === requestId ? { ...req, status: 'In Review with Facul' } : req
          )
        );
      } else {
        alert('Failed to send request to faculty.');
      }
    } catch (err) {
      alert('Server error while sending request to faculty.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setStudentDetails(null);
    setLatestAdvisorNote('');
    setNewNote('');
    setSelectedRequestId(null);
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
                <th>Student</th>
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
                  <td>{`${request.first_name} ${request.last_name}`}</td>
                  <td>{request.status}</td>
                  <td>
                    <button
                      onClick={() => fetchStudentDetails(request.submitted_by, request.request_id)}
                      className="btn btn-primary"
                    >
                      View Details
                    </button>
                    <select
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      defaultValue=""
                      className="faculty-select"
                    >
                      <option value="" disabled>
                        Select Faculty
                      </option>
                      {facultyMembers.map((faculty) => (
                        <option key={faculty.user_id} value={faculty.user_id}>
                          {faculty.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => sendToFaculty(request.request_id, selectedFaculty)}
                      className="btn btn-secondary"
                      disabled={!selectedFaculty}
                    >
                      Send to Faculty
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

      {/* Modal for Student Details */}
      {showModal && studentDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Student Details</h2>
            <p>
              <strong>Name:</strong> {`${studentDetails.first_name} ${studentDetails.last_name}`}
            </p>
            <p>
              <strong>Email:</strong> {studentDetails.email_id}
            </p>
            <p>
              <strong>CGPA:</strong> {studentDetails.cgpa}
            </p>
            <p>
              <strong>Program:</strong> {studentDetails.program}
            </p>
            <p>
              <strong>Year Level:</strong> {studentDetails.year_level}
            </p>
            <h3>Past Courses</h3>
            {pastCourses.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Title</th>
                    <th>Term</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {pastCourses.map((course) => (
                    <tr key={course.course_code}>
                      <td>{course.course_code}</td>
                      <td>{course.course_title}</td>
                      <td>{course.term_taken}</td>
                      <td>{course.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No past courses found.</p>
            )}
            <h3>Latest Advisor Note</h3>
            <p>{latestAdvisorNote}</p>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note"
            />
            <button onClick={addNote}>Add Note</button>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeptChairDashboard;
