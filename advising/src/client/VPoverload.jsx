import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/index.css';

function VPOverloadPage() {
  const navigate = useNavigate();
  const [overloadRequests, setOverloadRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');

  // Fetch VP overload requests
  useEffect(() => {
    const fetchOverloadRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in first.');
          setLoading(false);
          return;
        }
    
        const response = await fetch('http://localhost:5000/api/overload-requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
        });
    
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Received non-JSON response:', text);
          throw new Error('Server returned unexpected response');
        }
    
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.msg || 'Failed to fetch requests');
        }
    
        setOverloadRequests(data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Error fetching requests');
        setLoading(false);
      }
    };

    fetchOverloadRequests();
  }, []);

  // View request details
  const handleViewDetails = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/overload-requests/${requestId}`,
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
      setSelectedRequest(data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching Overload details:', err);
      alert('Server error');
    }
  };
// In VPOverloadPage.js, update the notes modal opening:
const openNotesModal = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:5000/api/overload-requests/${requestId}/notes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.msg || 'Error fetching notes');
      return;
    }

    const data = await response.json();
    setNotes(data.notes || []);
    setSelectedRequest({ request_id: requestId });
    setNotesModalVisible(true);
  } catch (err) {
    console.error('Error fetching notes:', err);
    alert('Server error');
  }
};

// Update the save note function:
const saveNewNote = async () => {
  if (!newNoteContent.trim()) {
    alert('Note content cannot be empty');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('User not authenticated. Please log in.');
    return;
  }

  if (!selectedRequest || !selectedRequest.request_id) {
    alert('No request selected.');
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/overload-requests/${selectedRequest.request_id}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNoteContent,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Error saving note');
    }

    const data = await response.json();
    console.log('Server response:', data); // Log the entire response

    // Check if the note is present in the response
    if (data.note) {
      console.log('New note added:', data.note); // Log the new note data
      // Refresh the notes list by fetching the latest notes
      await openNotesModal(selectedRequest.request_id);
    } else {
      console.error('New note data is missing required properties:', data.note);
    }

    setNewNoteContent('');
  } catch (err) {
    console.error('Error saving note:', err);
    alert(err.message || 'Failed to save note');
  }
};
  

  // Approve or reject a request
  const handleDecision = async (decision) => {
    if (!selectedRequest || !window.confirm(`Are you sure you want to ${decision} this request?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/overload-requests/${selectedRequest.request_id}/decision`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: decision }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.msg || `Failed to ${decision} request`);
        return;
      }

      // Update local state
      setOverloadRequests(prev =>
        prev.map(req =>
          req.request_id === selectedRequest.request_id ? { ...req, status: decision } : req
        )
      );
      
      alert(`Request ${decision} successfully`);
      setShowDetailsModal(false);
    } catch (err) {
      console.error(`Error ${decision} request:`, err);
      alert('Server error');
    }
  };

  return (
    <div className="vp-overload-page">
      <header className="page-header">
        <h1>VP Overload Requests Management</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Dashboard
        </button>
      </header>

      <div className="content-container">
        {loading ? (
          <p>Loading overload requests...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="overload-content">
            <h2>Pending VP Review</h2>
            
            {overloadRequests.length === 0 ? (
              <p>No overload requests currently pending VP review.</p>
            ) : (
              <div className="table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Semester</th>
                      <th>Credits</th>
                      <th>Status</th>
                      <th>Reviewed By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overloadRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td>{req.request_id}</td>
                        <td>{req.first_name} {req.last_name}</td>
                        <td>{req.semester}</td>
                        <td>{req.total_credits}</td>
                        <td>{req.status}</td>
                        <td>{req.dean_first_name} {req.dean_last_name}</td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(req.request_id)}
                            className="action-button view-details"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => openNotesModal(req.request_id)}
                            className="action-button note-request"
                          >
                            Notes
                          </button>
                          {req.status === 'VP Review' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  handleDecision('Approved');
                                }}
                                className="action-button approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  handleDecision('Rejected');
                                }}
                                className="action-button reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Overload Request Details</h2>
            <div className="request-details-grid">
              <div>
                <p><strong>Request ID:</strong> {selectedRequest.request_id}</p>
                <p><strong>Student:</strong> {selectedRequest.first_name} {selectedRequest.last_name}</p>
                <p><strong>Student Email:</strong> {selectedRequest.student_email}</p>
              </div>
              <div>
                <p><strong>Semester:</strong> {selectedRequest.semester}</p>
                <p><strong>Total Credits:</strong> {selectedRequest.total_credits}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
              </div>
            </div>
            
            <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            
            {selectedRequest.overload_subjects && (
              <p><strong>Overload Subjects:</strong> {selectedRequest.overload_subjects}</p>
            )}

            <div className="dean-info">
              <h3>Dean Information</h3>
              <p><strong>Reviewed by:</strong> {selectedRequest.dean_first_name} {selectedRequest.dean_last_name}</p>
              <p><strong>Dean Email:</strong> {selectedRequest.dean_email}</p>
            </div>

            {selectedRequest.selectedCourses && selectedRequest.selectedCourses.length > 0 && (
              <div className="courses-section">
                <h3>Selected Courses</h3>
                <ul>
                  {selectedRequest.selectedCourses.map((course, index) => (
                    <li key={index}>
                      {course.course_code} - {course.course_title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button 
                onClick={() => handleDecision('Approved')}
                className="action-button approve"
              >
                Approve
              </button>
              <button 
                onClick={() => handleDecision('Rejected')}
                className="action-button reject"
              >
                Reject
              </button>
              <button onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Notes for Request ID: {selectedRequest.request_id}</h2>
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.note_id} className="note-item">
                  <p>
                    <strong>{note.role ? note.role : 'Unknown Role'}:</strong> {note.content}
                  </p>
                  <p className="note-timestamp">
                    <em>{new Date(note.created_at).toLocaleString()}</em>
                  </p>
                  <button onClick={() => {
                    const newContent = prompt('Edit note:', note.content);
                    if (newContent !== null) {
                      // updateNote(note.note_id, newContent);
                    }
                  }}>
                    Edit Note
                  </button>
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
            <div className="modal-actions">
              <button onClick={saveNewNote}>Save Note</button>
              <button onClick={() => setNotesModalVisible(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VPOverloadPage;