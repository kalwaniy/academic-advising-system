/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PrerequisiteWaiver() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    reason: '',
    classRequest: '',
    seniorDesignRequest: '',
    coopWaiver: '',
    jdDocument: null,
  });

  const classOptions = [
    'MATH 101 - Section 1',
    'MATH 101 - Section 2',
    'NSSA 102 - Section 1',
    'NSSA 102 - Section 2',
    'GCIS 123 - Section 1',
    'GCIS 123 - Section 2',
    'GCIS 124 - Section 1',
    'ISTE 140 - Section 1',
    'ISTE 190 - Section 1',
    'CSEC 102 - Section 1',
    'CSEC 140 - Section 1',
    'COMM 142 - Section 1',
    'MATH 131 - Section 1',
    'MATH 161 - Section 1',
    'STAT 145 - Section 1',
    'NSSA 220 - Section 1',
    'NSSA 241 - Section 1',
    'NSSA 221 - Section 1',
    'ISTE 230 - Section 1',
    'ISTE 240 - Section 1',
    'ISTE 99 - Section 1',
    'Coop Seminar - Section 1',
    'ISTE 260 - Section 1',
    'ISTE 430 - Section 1',
    'ISTE 500 - Section 1',
    'ISTE 501 - Section 1',
    'COMM 203 - Section 1',
    'NSSA 242 - Section 1',
    'NSSA 244 - Section 1',
    'NSSA 370 - Section 1',
    'NSSA 322 - Section 1',
    'NSSA 245 - Section 1',
    'NSSA 441 - Section 1',
    'NSSA 443 - Section 1',
    'NSSA 341 - Section 1',
    'ISTE 470 - Section 1',
    'ISTE 436 - Section 1',
    'ISTE 330 - Section 1',
    'ISTE 262 - Section 1',
    'SWEN 383 - Section 1',
    'ISTE 438 - Section 1',
    'ISTE 434 - Section 1',
    'ISTE 340 - Section 1',
    'ISTE 432 - Section 1',
    'ISTE 341 - Section 1',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic
    console.log('Form submitted:', formData);
  };

  const handleLogout = () => {
    navigate('/LoginPage');
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>Page 1</li>
          <li style={{ marginBottom: '10px' }}>Page 2</li>
          <li style={{ marginBottom: '10px' }}>Page 3</li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1 }}>
        {/* Navbar */}
        <div style={{ backgroundColor: '#FF5C00', color: '#fff', padding: '10px' }}>
          <button onClick={navigateToDashboard} style={{ marginRight: '20px', backgroundColor: '#333', color: '#fff', border: 'none' }}>Home</button>
          <button onClick={handleLogout} style={{ backgroundColor: '#333', color: '#fff', border: 'none' }}>Logout</button>
        </div>

        {/* Page Content */}
        <div style={{ padding: '20px' }}>
          <h1>Prerequisite Waiver Form</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <label>
              Name:
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
            </label>
            <label>
              Email:
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </label>
            <label>
              Date:
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
            </label>
            <label>
              Class Requested:
              <input
                type="text"
                list="classOptions"
                name="classRequest"
                value={formData.classRequest}
                onChange={handleInputChange}
              />
              <datalist id="classOptions">
                {classOptions.map((classOption, index) => (
                  <option key={index} value={classOption} />
                ))}
              </datalist>
            </label>
            <label>
              Reason for asking pre-requisite:
              <textarea name="reason" value={formData.reason} onChange={handleInputChange} />
            </label>
            <label>
              Please explain in detail why you feel you are prepared to take this course without having completed the pre- or co-requisite(s):
              <textarea name="detailedReason" value={formData.detailedReason} onChange={handleInputChange}></textarea>
            </label>
            <label>
              Is this form a request for a prerequisite waiver to take Senior Design I (EEEE 497/ISEE 497/MECE 497) or MECE 348 Contemporary Issues?
              <input
                type="radio"
                name="seniorDesignRequest"
                value="yes"
                checked={formData.seniorDesignRequest === 'yes'}
                onChange={handleInputChange}
              /> Yes
              <input
                type="radio"
                name="seniorDesignRequest"
                value="no"
                checked={formData.seniorDesignRequest === 'no'}
                onChange={handleInputChange}
              /> No
            </label>
            <label>
              Are you applying for a waiver for COOP 1?
              <input
                type="radio"
                name="coopWaiver"
                value="yes"
                checked={formData.coopWaiver === 'yes'}
                onChange={handleInputChange}
              /> Yes
              <input
                type="radio"
                name="coopWaiver"
                value="no"
                checked={formData.coopWaiver === 'no'}
                onChange={handleInputChange}
              /> No
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
