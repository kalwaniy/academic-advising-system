/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function DeptChairDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [latestAdvisorNote, setLatestAdvisorNote] = useState(''); // State for the latest advisor note
  const [newNote, setNewNote] = useState(''); // State for new note input
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null); // Track selected request for notes
  const [pastCourses, setPastCourses] = useState([]); // State to hold past courses
  const [deptChairNote, setDeptChairNote] = useState(''); // State to hold department chair's note


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

    // Fetch requests on component load
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
        setSelectedRequestId(requestId); // Save selected request ID
        await fetchPastCourses(studentId); // Fetch the past courses for the student
        await fetchLatestAdvisorNote(requestId); // Fetch the latest advisor note for the selected request
        await fetchDeptChairNote(requestId); // Fetch the department chair's note for the selected request
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
        console.error('Error fetching latest advisor note:', await response.text());
        setLatestAdvisorNote('No advisor notes found.');
      }
    } catch (err) {
      console.error('Error fetching latest advisor note:', err);
      setLatestAdvisorNote('Error fetching advisor note.');
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
        setNewNote(''); // Clear the note input field
        fetchLatestAdvisorNote(selectedRequestId); // Refresh latest advisor note after adding
      } else {
        console.error('Error adding note:', await response.text());
        alert('Failed to add note.');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Server error while adding note.');
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
        setPastCourses(courses); // Populate past courses for the student
      } else {
        console.error('Error fetching past courses:', await response.text());
        setPastCourses([]);
      }
    } catch (err) {
      console.error('Error fetching past courses:', err);
      setPastCourses([]);
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
        console.error('Error fetching department chair note:', await response.text());
        setDeptChairNote('No department chair notes found.');
      }
    } catch (err) {
      console.error('Error fetching department chair note:', err);
      setDeptChairNote('Error fetching department chair note.');
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
                    <button onClick={() => fetchStudentDetails(request.submitted_by, request.request_id)}>
                      View Details & Latest Note
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

      {/* Modal for Viewing Details and Latest Advisor Note */}
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

      <h3>Past Courses</h3>
      {pastCourses.length > 0 ? (
        <table className="past-courses-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Term Taken</th>
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

      <h3>Your Note</h3>
      <p>{deptChairNote}</p>

      <h3>Add or Update Your Note</h3>
      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        rows="5"
        cols="50"
        placeholder="Add or update your note here..."
      />
      <button onClick={addNote} className="btn btn-primary">
        Save Note
      </button>
      <button onClick={closeModal} className="btn btn-secondary">
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default DeptChairDashboard;
