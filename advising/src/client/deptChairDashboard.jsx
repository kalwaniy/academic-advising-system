/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function DeptChairDashboard() {
  // **** State Variables ****
  const [requests, setRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [latestAdvisorNote, setLatestAdvisorNote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pastCourses, setPastCourses] = useState([]);
  const [deptChairNote, setDeptChairNote] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [deptChairNotes, setDeptChairNotes] = useState([]);
  const [advisorNotes, setAdvisorNotes] = useState([]);

  // **** useEffect Hook ****
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
          setRequests(data.requests.filter((req) => req.status === 'In-Review'));
          setCompletedRequests(data.completedRequests);
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
  }, []); // Empty dependency array to run only once

  // **** Function: fetchStudentDetails ****
  const fetchStudentDetails = async (studentId, requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/student-details/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudentDetails(data);
        setSelectedRequestId(requestId);

        // Fetch past courses
        await fetchPastCourses(studentId);

        // Fetch all notes (advisor, faculty, and department chair)
        await fetchAllNotes(requestId);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Error fetching student details.');
      }
    } catch (err) {
      setError('Server error: Unable to fetch student details.');
    }
  };

  // **** Function: fetchPastCourses ****
  const fetchPastCourses = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/student-past-courses/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

  // **** Function: fetchAllNotes ****
  const fetchAllNotes = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/notes/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.ok) {
        const notes = await response.json();
        console.log('Fetched notes:', notes); // Debugging
  
        // Separate notes by role (using case-insensitive comparison)
        const advisorNotes = notes.filter((note) => note.role.toLowerCase() === 'advisor');
        const facultyNotes = notes.filter((note) => note.role.toLowerCase() === 'faculty');
        const deptChairNotes = notes.filter((note) => note.role.toLowerCase() === 'dept_chair');
  
        setAdvisorNotes(advisorNotes);
        setFacultyNotes(facultyNotes);
        setDeptChairNotes(deptChairNotes);
  
        // Set the latest advisor note
        setLatestAdvisorNote(
          advisorNotes.length > 0
            ? advisorNotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].note_text
            : 'No advisor notes available.'
        );
      } else {
        const errorData = await response.json();
        console.error('Error fetching notes:', errorData);
        alert(errorData.msg || 'Failed to fetch notes for this request.');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      alert('Error fetching notes for this request.');
    }
  };
  

  // **** Function: addNote ****
  const addNote = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/notes/${selectedRequestId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note_text: newNote }),
        }
      );

      if (response.ok) {
        setNewNote('');
        await fetchAllNotes(selectedRequestId); // Refresh notes
        alert('Note added successfully!');
      } else {
        alert('Failed to add note.');
      }
    } catch (err) {
      alert('Server error while adding note.');
    }
  };

  // **** Function: sendToFaculty ****
  const sendToFaculty = async (requestId, facultyId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/send-to-faculty/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ facultyId }),
        }
      );

      if (response.ok) {
        alert('Request sent to faculty successfully! Email notification sent.');
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.request_id === requestId ? { ...req, status: 'In Review with Faculty' } : req
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to send request to faculty.');
      }
    } catch (err) {
      console.error('Error sending request to faculty:', err);
      alert('Server error while sending request to faculty.');
    }
  };

  // **** Function: handleApprove ****
  const handleApprove = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/approve/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Request approved successfully!');
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.request_id !== requestId)
        );
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to approve request.');
      }
    } catch (err) {
      alert('Server error while approving request.');
    }
  };

  // **** Function: handleReject ****
  const handleReject = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/department-chair/reject/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Request rejected successfully!');
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.request_id !== requestId)
        );
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to reject request.');
      }
    } catch (err) {
      alert('Server error while rejecting request.');
    }
  };

  // **** Function: closeModal ****
  const closeModal = () => {
    setShowModal(false);
    setStudentDetails(null);
    setLatestAdvisorNote('');
    setNewNote('');
    setSelectedRequestId(null);
    setPastCourses([]);
    setFacultyNotes([]);
    setDeptChairNotes([]);
    setAdvisorNotes([]);
  };

  // **** Render Function ****
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
                    <button
                      onClick={() => handleApprove(request.request_id)}
                      className="btn btn-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.request_id)}
                      className="btn btn-danger"
                    >
                      Reject
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
      {/* Second Table: Completed by Faculty */}
      {completedRequests.length > 0 ? (
        <div className="table-container">
          <h2>Review by Faculty Completed</h2>
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
              {completedRequests.map((request) => (
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
                    <button
                      onClick={() => handleApprove(request.request_id)}
                      className="btn btn-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.request_id)}
                      className="btn btn-danger"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No completed requests found</p>
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
              <table className="course-table">
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
            <h3>Faculty Notes</h3>
            {facultyNotes.length > 0 ? (
              <ul>
                {facultyNotes.map((note) => (
                  <li key={note.note_id}>
                    <p>
                      <strong>Faculty Note:</strong> {note.note_text}
                    </p>
                    <p>
                      <em>Created At: {new Date(note.created_at).toLocaleString()}</em>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No faculty notes available.</p>
            )}
            <h3>Department Chair Notes</h3>
            {deptChairNotes.length > 0 ? (
              <ul>
                {deptChairNotes.map((note) => (
                  <li key={note.note_id}>
                    <p>
                      <strong>Dept Chair Note:</strong> {note.note_text}
                    </p>
                    <p>
                      <em>Created At: {new Date(note.created_at).toLocaleString()}</em>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No department chair notes available.</p>
            )}
            <h3>Advisor Notes</h3>
            {advisorNotes.length > 0 ? (
              <ul>
                {advisorNotes.map((note) => (
                  <li key={note.note_id}>
                    <p>
                      <strong>Advisor Note:</strong> {note.note_text}
                    </p>
                    <p>
                      <em>Created At: {new Date(note.created_at).toLocaleString()}</em>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No advisor notes available.</p>
            )}
            <h3>Add a New Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add your note here..."
              rows="4"
              cols="50"
            />
            <div className="modal-buttons">
              <button onClick={addNote} className="btn btn-primary">
                Add Note
              </button>
              <button onClick={closeModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeptChairDashboard;
