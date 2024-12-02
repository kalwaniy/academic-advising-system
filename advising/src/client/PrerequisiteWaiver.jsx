/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Import the select component for searchable dropdowns
import './styles/index.css';

function PrerequisiteWaiver() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    uid: '',
    cgpa: '',
    term: '',
    classRequest: '',
    reason: '',
    detailedReason: '',
    seniorDesignRequest: 'no', // Default value set to 'no'
    coopWaiver: 'no', // Default value set to 'no'
    jdDocument: null,
  });

  const [courses, setCourses] = useState([]); // State to store fetched courses

  // Fetch student data and courses when the component mounts
  useEffect(() => {
    // Fetch student data
    fetch('http://localhost:5000/api/student-data', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error fetching student data: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setFormData((prevData) => ({
          ...prevData,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email_id,
          uid: data.university_id,
          cgpa: data.CGPA,
        }));
      })
      .catch((err) => console.error('Error fetching student data:', err));

    // Fetch courses from the server
    fetch('http://localhost:5000/api/courses', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error fetching courses: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setCourses(data.map((course) => ({
          value: course.course_code,
          label: `${course.course_code} - ${course.course_title}`,
        })));
      })
      .catch((err) => console.error('Error fetching courses:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({ ...formData, [name]: type === 'file' ? files[0] : value });
  };

  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, classRequest: selectedOption.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Prepare FormData and map uid to submitted_by explicitly
    const submitData = new FormData();
    submitData.append('submitted_by', formData.uid); // explicit mapping
  
    // Convert seniorDesignRequest and coopWaiver to boolean equivalents (1/0)
    submitData.append('seniorDesignRequest', formData.seniorDesignRequest === 'yes' ? 1 : 0);
    submitData.append('coopWaiver', formData.coopWaiver === 'yes' ? 1 : 0);
  
    // Handle file upload for JD Document
    if (formData.jdDocument) {
      submitData.append('jdDocument', formData.jdDocument);
    }
  
    // Append other form data
    Object.entries(formData).forEach(([key, value]) => {
      if (!['uid', 'seniorDesignRequest', 'coopWaiver', 'jdDocument'].includes(key)) {
        submitData.append(key, value); // exclude uid as it's now mapped to submitted_by
      }
    });
  
    fetch('http://localhost:5000/api/prerequisite-waiver/submit', {
      method: 'POST',
      body: submitData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error submitting form: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          alert('Form submitted successfully!');
        } else {
          alert('Error submitting form.');
        }
      })
      .catch((err) => console.error('Error submitting form:', err));
  };
  
  
  

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>Page 1</li>
          <li style={{ marginBottom: '10px' }}>Page 2</li>
          <li style={{ marginBottom: '10px' }}>Page 3</li>
        </ul>
      </div>

      <div style={{ flexGrow: 1 }}>
        <div style={{ backgroundColor: '#FF5C00', color: '#fff', padding: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ marginRight: '20px', backgroundColor: '#333', color: '#fff', border: 'none' }}>Home</button>
          <button onClick={() => navigate('/LoginPage')} style={{ backgroundColor: '#333', color: '#fff', border: 'none' }}>Logout</button>
        </div>

        <div style={{ padding: '20px' }}>
          <h1>Prerequisite Waiver Form</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <label>
              Name:
              <input type="text" name="name" value={formData.name} readOnly required />
            </label>
            <label>
              Email:
              <input type="email" name="email" value={formData.email} readOnly required />
            </label>
            <label>
              University ID (UID):
              <input type="text" name="uid" value={formData.uid} readOnly required />
            </label>
            <label>
              Cumulative GPA (CGPA):
              <input type="number" step="0.01" name="cgpa" value={formData.cgpa} readOnly required />
            </label>
            <label>
              Term Requested:
              <input type="text" name="term" value={formData.term} onChange={handleInputChange} placeholder="e.g., Fall 2024 (2241)" required />
            </label>
            <label>
              Class Requested:
              <Select
                options={courses}
                onChange={handleSelectChange}
                placeholder="Select a course..."
                isSearchable
                required
              />
            </label>
            <label>
              Reason for asking pre-requisite:
              <textarea name="reason" value={formData.reason} onChange={handleInputChange} required />
            </label>
            <label>
              Detailed reason:
              <textarea name="detailedReason" value={formData.detailedReason} onChange={handleInputChange} required />
            </label>
            <label>
              Senior Design Request:
              <input type="radio" name="seniorDesignRequest" value="yes" checked={formData.seniorDesignRequest === 'yes'} onChange={handleInputChange} /> Yes
              <input type="radio" name="seniorDesignRequest" value="no" checked={formData.seniorDesignRequest === 'no'} onChange={handleInputChange} /> No
            </label>
            <label>
              COOP Waiver:
              <input type="radio" name="coopWaiver" value="yes" checked={formData.coopWaiver === 'yes'} onChange={handleInputChange} /> Yes
              <input type="radio" name="coopWaiver" value="no" checked={formData.coopWaiver === 'no'} onChange={handleInputChange} /> No
            </label>
            <label>
              Upload JD (PDF only):
              <input type="file" name="jdDocument" accept=".pdf" onChange={handleInputChange} />
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PrerequisiteWaiver;
