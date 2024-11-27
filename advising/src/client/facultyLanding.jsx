/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// Define sections on the landing page
const sections = [
  { title: 'View Courses', icon: '📚', description: 'Manage your course assignments', link: '/faculty-courses' },
  { title: 'Student Requests', icon: '📨', description: 'Review student prerequisite waivers', link: '/faculty-requests' },
  { title: 'Reports', icon: '📊', description: 'Access your performance and feedback reports', link: '/faculty-reports' },
];

function FacultyLanding() {
  const [fullName, setFullName] = useState(''); // Store faculty member's full name
  const navigate = useNavigate();

  // Fetch faculty info from the users table
  useEffect(() => {
    const fetchFacultyInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/faculty/user-info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          console.warn('Incomplete user data received:', response.data);
          setFullName('Faculty Member'); // Fallback name
        }
      } catch (error) {
        console.error('Error fetching faculty info:', error);
        if (error.response && error.response.status === 404) {
          navigate('/login'); // Redirect to login if not found
        }
      }
    };

    fetchFacultyInfo();
  }, [navigate]);

  // Handle navigation when a section is clicked
  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {fullName || 'Faculty Member'}!</h1>
        </header>
        <div className="dashboard-cards">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`dashboard-card ${section.link ? 'clickable' : ''}`}
              onClick={() => section.link && handleClick(section.link)}
            >
              <div className="card-icon">{section.icon}</div>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel />
    </div>
  );
}

export default FacultyLanding;
