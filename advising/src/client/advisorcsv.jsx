/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

function CsvUpload() {
  const [studentInfoFile, setStudentInfoFile] = useState(null);
  const [studentCoursesFile, setStudentCoursesFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Updated handleStudentInfoChange with client-side validation
  const handleStudentInfoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadMessage('Please select a valid CSV file for Student Personal Information.');
      setStudentInfoFile(null);
      return;
    }
    setStudentInfoFile(file);
  };

  // Updated handleStudentCoursesChange with client-side validation
  const handleStudentCoursesChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadMessage('Please select a valid CSV file for Student Courses.');
      setStudentCoursesFile(null);
      return;
    }
    setStudentCoursesFile(file);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!studentInfoFile || !studentCoursesFile) {
      setUploadMessage('Please select both CSV files.');
      return;
    }

    setLoading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('studentInfoFile', studentInfoFile);
    formData.append('studentCoursesFile', studentCoursesFile);

    try {
      const response = await fetch('/api/advisor/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setUploadMessage(result.message);
      } else {
        setUploadMessage(result.error || 'An error occurred during CSV processing.');
      }
    } catch (error) {
      console.error('Error uploading CSV files:', error);
      setUploadMessage('An error occurred while uploading the files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Student CSV Files</h2>
      <form onSubmit={handleCsvUpload}>
        <div>
          <label>Student Personal Information CSV:</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleStudentInfoChange}
            required
          />
        </div>
        <div>
          <label>Student Courses CSV:</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleStudentCoursesChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload CSV Files'}
        </button>
      </form>
      {uploadMessage && <p>{uploadMessage}</p>}
    </div>
  );
}

export default CsvUpload;