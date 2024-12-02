/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './styles/index.css';

function FacultyDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);


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
  

  const fetchNotes = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/faculty/notes/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        setSelectedRequestId(requestId);
        setShowNotesModal(true);
      } else {
        console.error('Error fetching notes:', await response.text());
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  
  const addNote = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/faculty/notes/${selectedRequestId}`, {
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
        fetchNotes(selectedRequestId); // Refresh notes
      } else {
        console.error('Error adding note:', await response.text());
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };
  
  const completeReview = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/faculty/complete-review/${requestId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.ok) {
        alert('Review completed successfully! An alert has been sent to the department chair.');
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.request_id === requestId ? { ...req, status: 'Completed by Faculty' } : req
          )
        );
      } else {
        console.error('Error completing review:', await response.text());
        alert('Failed to complete review.');
      }
    } catch (err) {
      console.error('Error completing review:', err);
      alert('Server error while completing review.');
    }
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
                    <button onClick={() => fetchNotes(request.request_id)}>View Notes</button>
                    <button onClick={() => completeReview(request.request_id)} className="btn btn-primary">
    Complete Review
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

{showNotesModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Notes for Request ID: {selectedRequestId}</h2>
      <ul>
        {notes.map((note) => (
          <li key={note.note_id}>
            <p><strong>{note.role}:</strong> {note.note_text}</p>
            <p><em>{new Date(note.created_at).toLocaleString()}</em></p>
          </li>
        ))}
      </ul>

      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add your note here..."
      />
      <button onClick={addNote} className="btn btn-primary">
        Add Note
      </button>
      <button onClick={() => setShowNotesModal(false)} className="btn btn-secondary">
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default FacultyDashboard;
