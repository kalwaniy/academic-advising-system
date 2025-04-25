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
  const [coopRequests, setCoopRequests] = useState([]); // New state for COOP requests
  const [coopActions, setCoopActions] = useState({}); // State for COOP actions
  const [notes, setNotes] = useState([]); // Change from '' to []
  const [newNoteContent, setNewNoteContent] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // New state for filter
  const [searchTerm, setSearchTerm] = useState('');


 
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
                setCoopRequests(data.coopRequests || []);
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




const fetchStudentDetails = async (studentId, requestId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `http://localhost:5000/api/advisor/student-details/${studentId}?requestId=${requestId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Check for COOP details and include them
      const coopDetails = data.coopDetails || [];
      console.log('Fetched COOP Details:', coopDetails); // Debugging purpose

      setStudentDetails({
        ...data,
        coopDetails, // Add COOP details to the student details state
      });

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
        },
      });
 
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notes:', data); // Debugging step
        setNotes(data.notes || []); // Ensure that "notes" are correctly set
      } else {
        setNotes([]);
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
  const handleSendToDeptChair = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/send-to-dept-chair/${requestId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'In-Review' }), // Send the new status
      });
      if (response.ok) {
        alert('Request sent to Dept Chair successfully, and the Department Chair has been notified!');
        setRequests((prev) =>
          prev.map((req) =>
            req.request_id === requestId ? { ...req, status: 'In-Review' } : req
          )
        ); // Update the status locally
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Error sending request to Dept Chair.');
      }
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Server error. Try again later.');
    }
  };


  const handleCoopAction = async (requestId, action, notes = '') => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/coop-review/${requestId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes }),
      });


      if (response.ok) {
        alert('COOP action processed successfully!');
        setCoopRequests((prev) => prev.filter((req) => req.request_id !== requestId)); // Remove completed request
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to process COOP action.');
      }
    } catch (err) {
      alert('Server error while processing COOP action.');
    }
  };


  const saveNewNote = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/notes/${selectedRequestId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNoteContent, // Ensure this matches the backend
          role: 'Advisor', // Role of the person adding the note
        }),
      });
 
      if (response.ok) {
        const newNote = await response.json();
        setNotes((prevNotes) => [newNote, ...prevNotes]); // Prepend the new note
        setNewNoteContent(''); // Clear the input field
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
 
 
  // New function to handle filter changes
  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };


  // Filtered requests based on selected status
  const filteredRequests = requests.filter((request) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'COOP') return request.coop_request === 1 && request.status === 'Pending with COOP';
    return request.status === filterStatus;
  })


  .filter((request) => {
    // Apply search filter
    const studentName = `${request.first_name} ${request.last_name}`.toLowerCase();
    const courseCode = request.course_code.toLowerCase();
    const courseTitle = request.course_title.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      studentName.includes(search) ||
      courseCode.includes(search) ||
      courseTitle.includes(search)
    );
  });


  // Function to determine if actions should be shown based on request status
  const shouldShowActions = (request) => {
    // Adjust this logic based on your requirements
    return request.status === 'Pending' || request.status === 'In-Review' || request.status === 'Pending with COOP' || request.status === 'COOP Review Complete';
  };


  const handleSendToStudent = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/advisor/send-to-student/${requestId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
 
      if (response.ok) {
        alert('Notification and email sent to the student!');
        // Optionally, refresh the request list
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Error sending notification and email to the student.');
      }
    } catch (err) {
      console.error('Error sending to student:', err);
      alert('Server error. Try again later.');
    }
  };
 
 
  return (
    <div className="advisor-dashboard">
      <h1 className="dashboard-title">Prerequisite Waiver Requests</h1>
      {error && <p className="error">{error}</p>}
  
      {/* Filter Controls */}
      <div className="filter-controls">
        <label>Filter by Status: </label>
        <select
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="In-Review">In-Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Pending with COOP">Pending with COOP</option>
          <option value="COOP">COOP Requests</option>
        </select>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by student name, course code, or course title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
  
      {/* Display Filtered Requests */}
      {filteredRequests.length > 0 ? (
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
                <th>Auto Processed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.request_id}</td>
                  <td>{request.course_code}</td>
                  <td>{request.course_title}</td>
                  <td>{request.reason_to_take}</td>
                  <td>{request.justification}</td>
                  <td>{request.term_requested}</td>
                  <td>{`${request.first_name} ${request.last_name}`}</td>
                  <td>{request.status}</td>
                  <td>{request.auto_processed ? 'Yes' : 'No'}</td>
                  <td>
                    {/* View Details */}
                    <button
                      onClick={() => fetchStudentDetails(request.submitted_by, request.request_id)}
                      className="action-button vie-details"
                    >
                      View Details
                    </button>
  
                    {/* Edit Request */}
                    <button
                      onClick={() => handleEditRequest(request)}
                      className="action-button edit-request"
                    >
                      Edit
                    </button>
  
{/* Send to Dept Chair */}
{['Pending', 'COOP Review Complete'].includes(request.status) && (
    <button
      onClick={() => handleSendToDeptChair(request.request_id)}
      className="action-button send-dept-chair"
    >
      Send to Dept Chair
    </button>
                    )}
  
                    {/* Send to Student for Approved/Rejected Requests */}
                    {['Approved', 'Rejected'].includes(request.status) && (
                      <button
                        onClick={() => handleSendToStudent(request.request_id)}
                        className="action-button send-student"
                      >
                        Send to Student
                      </button>
                    )}
  
                    {/* Edit/View Notes */}
                    <button
                      onClick={() => openNotesModal(request.request_id)}
                      className="action-button note1"
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
        <p>No requests found for the selected filter.</p>
      )}
  
      {/* Notes Modal */}
      {showModal && selectedRequestId && (
        <div className="modal-note1">
          <div className="modal-content note1-content">
            <h2 className="note1-title">Notes</h2>
            <div className="notes-list note1-list">
              {notes.map((note) => (
                <div key={note.note_id} className="note1-item">
                  <p>
                    <strong>{note.role}:</strong> {note.content}
                  </p>
                  <p className="note1-timestamp">
                    <em>{new Date(note.created_at).toLocaleString()}</em>
                  </p>
                  <hr />
                </div>
              ))}
            </div>
            <h3 className="note1-add-title">Add a New Note</h3>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows="5"
              cols="50"
              className="note1-textarea"
            />
            <button onClick={saveNewNote} className="btn btn-success note1-save">
              Save Note
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-secondary note1-close"
            >
              Close
            </button>
          </div>
        </div>
      )}


{/* Student Details Modal */}
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
      <p>
        <strong>Term Enrolled:</strong> {studentDetails.year_enrolled}
      </p>
      <p>
        <strong>Current Term:</strong> {studentDetails.current_term}
      </p>

      <h3>Prerequisites for Requested Course</h3>
      <table className="prerequisites-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Title</th>
          </tr>
        </thead>
        <tbody>
          {studentDetails.prerequisites.map((prerequisite) => (
            <tr key={prerequisite.prerequisite_course_code}>
              <td>{prerequisite.prerequisite_course_code}</td>
              <td>{prerequisite.prerequisite_title}</td>
            </tr>
          ))}
        </tbody>
      </table>

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

      {/* COOP Details */}
      {studentDetails.coopDetails && studentDetails.coopDetails.length > 0 && (
        <div>
          <h3>COOP Details</h3>
          <table className="coop-details-table">
            <thead>
              <tr>
                <th>COOP Course</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {studentDetails.coopDetails.map((coop) => (
                <tr key={coop.coop_course}>
                  <td>{coop.coop_course}</td>
                  <td>{coop.completed ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="note-modal-buttons">
      <button onClick={closeModal}>Close</button></div>
    </div>
  </div>
)}


      {/* Edit Request Modal */}
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
                  <option value="" disabled>
                    Select a course code
                  </option>
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
                  <option value="" disabled>
                    Select a course title
                  </option>
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
                  <option value="In-Review">In-Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending with COOP">Pending with COOP</option>
                </select>
              </label>
            </form><div className="note-modal-buttons">
            <button onClick={handleSaveChanges}>Save Changes</button>
            <button onClick={() => setEditModalVisible(false)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}


export default AdvisorDashboard;

