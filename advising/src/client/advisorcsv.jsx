/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

function CsvUpload() {
  const [studentInfoFile, setStudentInfoFile] = useState(null);
  const [studentCoursesFile, setStudentCoursesFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStudentInfoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadMessage('Please select a valid CSV file for Student Personal Information.');
      setUploadError(true);
      setStudentInfoFile(null);
      return;
    }
    setStudentInfoFile(file);
    setUploadMessage('');
    setUploadError(false);
  };

  const handleStudentCoursesChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadMessage('Please select a valid CSV file for Student Courses.');
      setUploadError(true);
      setStudentCoursesFile(null);
      return;
    }
    setStudentCoursesFile(file);
    setUploadMessage('');
    setUploadError(false);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!studentInfoFile || !studentCoursesFile) {
      setUploadMessage('Please select both CSV files.');
      setUploadError(true);
      return;
    }

    setLoading(true);
    setUploadMessage('');
    setUploadError(false);

    const formData = new FormData();
    formData.append('studentInfoFile', studentInfoFile);
    formData.append('studentCoursesFile', studentCoursesFile);

    try {
      const response = await fetch('http://localhost:5000/api/advisor/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const resultText = await response.text();
      let result;
      try {
        // Attempt to parse as JSON if possible
        result = JSON.parse(resultText);
      } catch {
        // If not JSON, treat as plain text
        result = { message: resultText };
      }

      if (response.ok) {
        setUploadMessage(result.message || 'CSV files have been processed successfully.');
        setUploadError(false);
      } else {
        setUploadMessage(result.error || 'An error occurred during CSV processing.');
        setUploadError(true);
      }
    } catch (error) {
      console.error('Error uploading CSV files:', error);
      setUploadMessage('An error occurred while uploading the files.');
      setUploadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Upload Student CSV Files</h2>
      <form onSubmit={handleCsvUpload} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="student-info-file" style={styles.label}>Student Personal Information CSV:</label>
          <input
            id="student-info-file"
            type="file"
            accept=".csv"
            onChange={handleStudentInfoChange}
            required
            style={styles.fileInput}
          />
          {studentInfoFile && <p style={styles.fileName}>Selected: {studentInfoFile.name}</p>}
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="student-courses-file" style={styles.label}>Student Courses CSV:</label>
          <input
            id="student-courses-file"
            type="file"
            accept=".csv"
            onChange={handleStudentCoursesChange}
            required
            style={styles.fileInput}
          />
          {studentCoursesFile && <p style={styles.fileName}>Selected: {studentCoursesFile.name}</p>}
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Uploading...' : 'Upload CSV Files'}
        </button>
      </form>
      {uploadMessage && (
        <p style={uploadError ? styles.errorMessage : styles.successMessage}>
          {uploadMessage}
        </p>
      )}
      {loading && <div style={styles.spinner}>⏳ Uploading, please wait...</div>}
    </div>
  );
}

// Simple inline styles; in a real app, move to a CSS file
const styles = {
  container: {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ccc',
    borderRadius: '8px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  fileInput: {
    padding: '5px',
  },
  fileName: {
    marginTop: '5px',
    fontSize: '0.9em',
    color: '#555',
  },
  button: {
    padding: '10px',
    backgroundColor: '#005bbb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    textAlign: 'center',
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginTop: '20px',
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginTop: '20px',
  },
  spinner: {
    textAlign: 'center',
    marginTop: '20px',
    fontStyle: 'italic',
  }
};

export default CsvUpload;
