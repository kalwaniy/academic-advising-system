/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function AdvisorOverloadDashboard() {
  const [overloadRequests, setOverloadRequests] = useState([]);
  const [error, setError] = useState('');

  // For searching and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // For selected request details
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // For editing a request
  const [editModalVisible, setEditModalVisible] = useState(false);

  // For notes
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // For viewing student details
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // Helper: Parse "overload_subjects" if it's stored as JSON
  function parseOverloadSubjects(value) {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return value;
    } catch {
      // If it's not valid JSON, return as-is
      return value;
    }
  }

  // 1. Fetch Overload Requests on initial mount
  useEffect(() => {
    fetchOverloadRequests();
  }, []);

  const fetchOverloadRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/advisor/overload-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.msg || 'Failed to fetch Overload Requests.');
        return;
      }

      const data = await response.json();
      setOverloadRequests(data);
    } catch (err) {
      console.error('Error fetching Overload Requests:', err);
      setError('Network error: cannot retrieve Overload Requests.');
    }
  };

  // 2. Filter & Search
  const filteredRequests = overloadRequests
    .filter((req) => {
      if (filterStatus === 'All') return true;
      return req.status === filterStatus;
    })
    .filter((req) => {
      const studentName = `${req.first_name} ${req.last_name}`.toLowerCase();
      const reason = req.reason?.toLowerCase() || '';
      const semester = req.semester?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return (
        studentName.includes(search) ||
        reason.includes(search) ||
        semester.includes(search)
      );
    });

  // 3. View Overload Request Details (including selected courses)
// In the advisor's handleViewOverloadDetails function:
const handleViewOverloadDetails = async (requestId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `http://localhost:5000/api/advisor/overload-requests/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.msg || 'Error fetching details');
      return;
    }

    const data = await response.json();
    
    // Also fetch notes
    const notesResponse = await fetch(
      `http://localhost:5000/api/advisor/overload-requests/${requestId}/notes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (notesResponse.ok) {
      const notesData = await notesResponse.json();
      data.notes = notesData.notes || [];
    }

    setSelectedRequest(data);
    setShowRequestModal(true);
  } catch (err) {
    console.error('Error fetching Overload details:', err);
    alert('Server error');
  }
};

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedRequest(null);
  };

  // 4. Edit a request
  const handleEditRequest = (req) => {
    setSelectedRequest(req);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedRequest(null);
  };

  const handleEditFieldChange = (fieldName, value) => {
    setSelectedRequest((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/overload-requests/${selectedRequest.request_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            semester: selectedRequest.semester,
            total_credits: selectedRequest.total_credits,
            reason: selectedRequest.reason,
            status: selectedRequest.status || 'Pending',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.msg || 'Error updating Overload Request');
        return;
      }

      alert('Overload request updated successfully!');
      setEditModalVisible(false);

      // Update local list
      setOverloadRequests((prev) =>
        prev.map((req) =>
          req.request_id === selectedRequest.request_id ? { ...req, ...selectedRequest } : req
        )
      );
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Server error');
    }
  };

  // 5. Notes
  const openNotesModal = async (requestId) => {
    setSelectedRequestId(requestId);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/overload-requests/${requestId}/notes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error('Error fetching notes for Overload', await response.text());
        setNotes([]);
      } else {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
    setNotesModalVisible(true);
  };

  const closeNotesModal = () => {
    setNotesModalVisible(false);
    setSelectedRequestId(null);
    setNewNoteContent('');
    setNotes([]);
  };

  const saveNewNote = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/overload-requests/${selectedRequestId}/notes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newNoteContent,
            role: 'Advisor',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to save note. Error: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const newNote = await response.json();
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      setNewNoteContent('');
      alert('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note.');
    }
  };

  // 6. View Student Details
  const handleViewStudentDetails = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/student-details/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.msg || 'Error fetching student details');
        return;
      }

      const data = await response.json();
      setStudentDetails(data);
      setShowStudentModal(true);
    } catch (err) {
      console.error('Error fetching student details:', err);
      alert('Server error');
    }
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setStudentDetails(null);
  };

  const handleSendToDean = async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/overload-requests/${requestId}/send-to-dean`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send to Dean');
      }
  
      // Update local state
      setOverloadRequests(prev => 
        prev.map(req => 
          req.request_id === requestId 
            ? { ...req, status: 'Dean Review' } 
            : req
        )
      );
      
      alert('Request successfully sent to Dean');
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error sending to Dean');
    }
  };
  const handleSendToStudent = async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in first.');
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/advisor/overload-requests/${requestId}/send-to-student`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send to student');
      }
  
      alert('Student notified successfully');
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error notifying student');
    }
  };


  return (
    <div className="advisor-overload-dashboard">
      <h1>Advisor Course Overload Requests</h1>
      {error && <p className="error">{error}</p>}

      {/* Filter Controls */}
      <div className="filter-controls">
        <label>Filter by Status: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by student, reason, or semester"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Overload Requests Table */}
      {filteredRequests.length > 0 ? (
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Semester</th>
                <th>Total Credits</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.request_id}>
                  <td>{req.request_id}</td>
                  <td>{req.first_name} {req.last_name}</td>
                  <td>{req.semester}</td>
                  <td>{req.total_credits}</td>
                  <td>{req.reason}</td>
                  <td>{req.status}</td>
                  <td>
                    <button
                      onClick={() => handleViewOverloadDetails(req.request_id)}
                      className="action-button view-details"
                    >
                      Overload Details
                    </button>
                    <button
                      onClick={() => handleEditRequest(req)}
                      className="action-button edit-request"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openNotesModal(req.request_id)}
                      className="action-button note-request"
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => handleViewStudentDetails(req.submitted_by)}
                      className="action-button student-details"
                    >
                      Student Details
                    </button>

                   
  <button
    onClick={() => handleSendToDean(req.request_id)}
    className={`action-button ${req.status === 'Dean Review' ? 'send-to-dean-disabled' : 'send-to-dean'}`}
    disabled={req.status === 'Dean Review'}
    title={req.status === 'Dean Review' ? 'Request is already with the Dean' : 'Send this request to the Dean'}
  >
    Send to Dean
  </button>


  <button
  onClick={() => handleSendToStudent(req.request_id)}
  className={`action-button ${!['Approved', 'Rejected'].includes(req.status) ? 'send-to-student-disabled' : 'send-to-student'}`}
  disabled={!['Approved', 'Rejected'].includes(req.status)}
  title={!['Approved', 'Rejected'].includes(req.status) ? 'Only approved/rejected requests can be sent to student' : 'Notify student about this decision'}
>
  Send to Student
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No Overload Requests found for your filter/search.</p>
      )}

      {/* Overload Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Overload Request Details</h2>
            <p><strong>Request ID:</strong> {selectedRequest.request_id}</p>
            <p><strong>Student:</strong> {selectedRequest.first_name} {selectedRequest.last_name}</p>
            <p><strong>Semester:</strong> {selectedRequest.semester}</p>
            <p><strong>Total Credits:</strong> {selectedRequest.total_credits}</p>
            <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            <p><strong>Status:</strong> {selectedRequest.status}</p>

            {/* Overload Subjects displayed as-is (if you want to parse JSON, define parseOverloadSubjects) */}
            <p><strong>Overload For:</strong> {selectedRequest.overload_subjects}</p>

            {selectedRequest.selectedCourses && selectedRequest.selectedCourses.length > 0 && (
              <>
                <h3>Selected Courses</h3>
                <ul>
                  {selectedRequest.selectedCourses.map((course) => (
                    <li key={course.course_code}>
                      {course.course_code} - {course.course_title}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="button-box">
              <button onClick={closeRequestModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalVisible && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Overload Request</h2>
            <div>
              <label>Semester: </label>
              <input
                type="text"
                value={selectedRequest.semester}
                onChange={(e) => handleEditFieldChange('semester', e.target.value)}
              />
            </div>
            <div>
              <label>Total Credits: </label>
              <input
                type="number"
                value={selectedRequest.total_credits}
                onChange={(e) => handleEditFieldChange('total_credits', e.target.value)}
              />
            </div>
            <div>
              <label>Reason: </label>
              <textarea
                value={selectedRequest.reason}
                onChange={(e) => handleEditFieldChange('reason', e.target.value)}
              />
            </div>
            <div>
              <label>Status: </label>
              <select
                value={selectedRequest.status}
                onChange={(e) => handleEditFieldChange('status', e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button onClick={handleSaveChanges}>Save</button>
            <button onClick={closeEditModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalVisible && selectedRequestId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Notes for Request ID: {selectedRequestId}</h2>
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.note_id} className="note-item">
                  <p>
                    <strong>{note.role}:</strong> {note.content}
                  </p>
                  <p className="note-timestamp">
                    <em>{new Date(note.created_at).toLocaleString()}</em>
                  </p>
                  <hr />
                </div>
              ))}
            </div>
            <h3>Add a New Note</h3>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows="5"
              cols="50"
            />
            <button onClick={saveNewNote}>Save Note</button>
            <button onClick={closeNotesModal}>Close</button>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentModal && studentDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Student Details</h2>
            <p><strong>Name:</strong> {studentDetails.first_name} {studentDetails.last_name}</p>
            <p><strong>Email:</strong> {studentDetails.email_id}</p>
            <p><strong>Program:</strong> {studentDetails.program}</p>
            <p><strong>CGPA:</strong> {studentDetails.cgpa}</p>
            <p><strong>Year Level:</strong> {studentDetails.year_level}</p>

            <h3>Past Courses & Grades</h3>
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
                {studentDetails.courseLog && studentDetails.courseLog.map((course) => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>{course.term_taken}</td>
                    <td>{course.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={closeStudentModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorOverloadDashboard;


