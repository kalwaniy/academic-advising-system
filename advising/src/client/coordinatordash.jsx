/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/index.css';

function CoordinatorDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');
  const [coop1Completed, setCoop1Completed] = useState(false);
  const [coop2Completed, setCoop2Completed] = useState(false);
  const [notes, setNotes] = useState([]); // Notes for the selected request
  const [newNote, setNewNote] = useState(''); // Input for adding a new note
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch pending COOP waiver requests
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/coordinator/coop-requests/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setPendingRequests(response.data.data || []);
      })
      .catch((err) => {
        console.error('Error fetching pending requests:', err);
        setError('Failed to fetch pending requests.');
      });
  }, []);

  // Fetch notes for a selected request
  const fetchNotes = async (requestId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/coordinator/notes/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotes(response.data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to fetch notes.');
    }
  };

  // Handle selecting a request
  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setComments('');
    fetchCoopCompletion(request.submitted_by); // Fetch COOP data for the student
    fetchNotes(request.request_id); // Fetch notes for the selected request
};



  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Note cannot be empty.');
      return;
    }
    try {
      await axios.post(
        `http://localhost:5000/api/coordinator/notes/${selectedRequest.request_id}`,
        { note_text: newNote },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNotes((prevNotes) => [
        { note_id: Date.now(), note_text: newNote, created_at: new Date().toISOString() },
        ...prevNotes,
      ]); // Optimistic update
      setNewNote('');
      alert('Note added successfully!');
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note.');
    }
  };

  

  const fetchCoopCompletion = async (studentId) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/coordinator/coop-completion/${studentId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const coopData = response.data.data.reduce((acc, item) => {
            acc[item.coop_course] = !!item.completed; // Convert to boolean
            return acc;
        }, {});

        setCoop1Completed(coopData['COOP 1'] || false);
        setCoop2Completed(coopData['COOP 2'] || false);
    } catch (err) {
        console.error('Error fetching COOP completion data:', err);
        setError('Failed to fetch COOP completion data.');
    }
};



const handleSubmitVerification = () => {
  setLoading(true);
  setError('');

  console.log('Submitting COOP verification for request:', selectedRequest.request_id);

  axios
    .post(
      `http://localhost:5000/api/coordinator/coop-verification/${selectedRequest.request_id}`,
      {
        comments,
        coop1Completed,
        coop2Completed,
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    .then((response) => {
      console.log('Verification Response:', response.data);

      alert('Verification submitted successfully!');
      setSelectedRequest(null);
      setPendingRequests((prev) =>
        prev.filter((req) => req.request_id !== selectedRequest.request_id)
      );
    })
    .catch((err) => {
      console.error('Error submitting verification:', err);
      setError('Failed to submit verification.');
    })
    .finally(() => setLoading(false));
};


  return (
    <div className="coordinator-dashboard">
      <h1>COOP Coordinator Dashboard</h1>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Pending Requests Table */}
      <div className="requests-table">
        <h2>Pending COOP Waiver Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Term</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.request_id}>
                <td>{request.request_id}</td>
                <td>
                  {request.first_name} {request.last_name}
                </td>
                <td>{request.course_title}</td>
                <td>{request.term_requested}</td>
                <td>
                  <button onClick={() => handleSelectRequest(request)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Details Section */}
      {selectedRequest && (
        <div className="request-details">
          <h2>Request Details</h2>
          <p>
            <strong>Request ID:</strong> {selectedRequest.request_id}
          </p>
          <p>
            <strong>Student:</strong> {selectedRequest.first_name} {selectedRequest.last_name}
          </p>
          <p>
            <strong>Course:</strong> {selectedRequest.course_title}
          </p>
          <p>
            <strong>Term:</strong> {selectedRequest.term_requested}
          </p>
          <p>
            <strong>Reason:</strong> {selectedRequest.reason_to_take}
          </p>
          <p>
            <strong>Justification:</strong> {selectedRequest.justification}
          </p>

          <div className="verification-section">
            <h3>COOP Verification</h3>
            <label>
              <input
                type="checkbox"
                checked={coop1Completed}
                onChange={(e) => setCoop1Completed(e.target.checked)}
              />
              COOP 1 Completed
            </label>
            <label>
              <input
                type="checkbox"
                checked={coop2Completed}
                onChange={(e) => setCoop2Completed(e.target.checked)}
              />
              COOP 2 Completed
            </label>
            <button
              onClick={handleSubmitVerification}
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Submitting...' : 'Submit Verification'}
            </button>
            <button
              onClick={() => setSelectedRequest(null)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>

          <div className="notes-section">
            <h3>Notes</h3>
            <ul>
              {notes.map((note) => (
                <li key={note.note_id}>
                  <p>{note.note_text}</p>
                  <p className="note-timestamp">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <textarea
              placeholder="Add a new note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={handleAddNote} className="add-note-button">
              Add Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorDashboard;
