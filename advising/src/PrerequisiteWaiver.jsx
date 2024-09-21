import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PrerequisiteWaiver() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    reason: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
              Reason for waiver:
              <textarea name="reason" value={formData.reason} onChange={handleInputChange}></textarea>
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PrerequisiteWaiver;
