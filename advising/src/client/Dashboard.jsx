import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Ensure jwtDecode is imported
import NotificationPanel from './NotificationPanel'; 
import './styles/index.css';

const sections = [
  { title: 'Prerequisite Waiver', icon: '📝', description: 'Click to proceed', link: '/PrerequisiteWaiver' },
  { title: 'StudentInfo', icon: '🎓', description: 'View student information', link: '/StudentInfo' },  
  { title: 'Tasks', icon: '⚠', description: 'No current tasks' },
];

function Dashboard() {
  const [username, setUsername] = useState(''); // Store the username
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve the token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token); // Decode the token
        console.log("Decoded token:", decoded);
        if (decoded && decoded.username) {
          setUsername(decoded.username); // Set the username from the token
        } else {
          console.error("Token does not contain a username.");
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    } else {
      console.warn('No token found, user may not be logged in.');
      navigate('/login'); // Redirect to login if no token
    }
  }, [navigate]); // Runs only once when the component mounts

  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {username || 'Student'}!</h1> {/* Display the logged-in user's username */}
        </header>
        <div className="dashboard-cards">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`dashboard-card ${section.link ? 'clickable' : ''}`} // Corrected here
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
