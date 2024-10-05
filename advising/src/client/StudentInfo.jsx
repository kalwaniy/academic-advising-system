import React, { useEffect, useState } from 'react';
import './styles/index.css';

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch student information from the backend
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token'); // Fetch the token from localStorage
        const response = await fetch('http://localhost:5000/api/studentsloa', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Pass token for authorization
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStudents(data); // Store student data in state
        } else {
          setError(data.msg || 'Failed to fetch student information');
        }
      } catch (err) {
        setError('Error fetching student data');
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="student-info-page">
      <h1>Student Information</h1>
      {error && <p className="error">{error}</p>}
      <table className="student-table">
        <thead>
          <tr>
            <th>University ID</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Email</th>
            <th>Major</th>
            <th>First Term Enroll</th>
            <th>Year Level</th>
            <th>CGPA</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index}>
              <td>{student.university_id}</td>
              <td>{student.last_name}</td>
              <td>{student.first_name}</td>
              <td>{student.university_email}</td>
              <td>{student.major}</td>
              <td>{student.first_term_enroll}</td>
              <td>{student.year_level}</td>
              <td>{student.cgpa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentInfo;
