/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// Define sections on the landing page
const sections = [
  { title: 'Manage Waivers', icon: '📜', description: 'Review and approve waivers', link: '/department-dashboard' },
  { title: 'Manage Faculty', icon: '👩‍🏫', description: 'View and manage faculty assignments', link: '/department-faculty' },
  { title: 'Department Reports', icon: '📊', description: 'View department performance reports', link: '/department-reports' },
];

function DepartmentChairLanding() {
  const [fullName, setFullName] = useState(''); // Store chair's full name
  const navigate = useNavigate();

  // Fetch department chair info from the server
  useEffect(() => {
    const fetchChairInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/department-chair/user-info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          console.warn('Incomplete user data received:', response.data);
          setFullName('Department Chair'); // Fallback name
        }
      } catch (error) {
        console.error('Error fetching chair info:', error);
        if (error.response && error.response.status === 404) {
          navigate('/login'); // Redirect to login if not found
        }
      }
    };

    fetchChairInfo();
  }, [navigate]);

  // Handle navigation when a section is clicked
  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {fullName || 'Department Chair'}!</h1>
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

export default DepartmentChairLanding;
