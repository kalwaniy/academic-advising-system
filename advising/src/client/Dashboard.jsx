/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

const sections = [
  { title: 'Prerequisite Waiver', icon: '📝', description: 'Click to proceed', link: '/Prerequisite-waiver' },
  { title: 'StudentInfo', icon: '🎓', description: 'View student information', link: '/student-info' },
  { title: 'Tasks', icon: '⚠', description: 'No current tasks' },
];

function Dashboard() {
  const [fullName, setFullName] = useState(''); // Store the full name
  const navigate = useNavigate();

  // Fetch user info from the server
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/student-dashboard/user-info', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        
        // Check if the response has data and destructure properly
        if (response.data && response.data.firstName && response.data.lastName) {
          const { firstName, lastName } = response.data;
  
          // Log to check the received data
          console.log('Received user info:', { firstName, lastName });
  
          // Set the fullName state with the fetched names
          setFullName(`${firstName} ${lastName}`);
        } else {
          console.warn('Incomplete user data received:', response.data);
          setFullName('Student'); // Fallback if data is incomplete
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response && error.response.status === 404) {
          navigate('/login'); // Redirect to login if user not found
        }
      }
    };
  
    fetchUserInfo();
  }, [navigate]);
  

  // Handle click on sections
  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {fullName || 'Student'}!</h1> {/* Display the logged-in user's full name */}
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

export default Dashboard;
