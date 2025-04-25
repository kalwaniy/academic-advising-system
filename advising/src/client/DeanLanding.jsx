import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// Define sections for Dean Landing Page
const deanSections = [
  { 
    title: 'Overload requests', 
    icon: '🎓', 
    description: 'Manage overload requests', 
    link: '/dean-overload' 
  },
  { 
    title: 'Student Affairs', 
    icon: '📖', 
    description: 'Oversee student-related decisions', 
    link: '/dean-students' 
  },
];

function DeanLanding() {
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeanInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user-info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          setFullName('Dean');
        }
      } catch (error) {
        console.error('Error fetching Dean info:', error);
        navigate('/login');
      }
    };
    fetchDeanInfo();
  }, [navigate]);

  return (
    <div className="advisor-dashboard-dean">
      <nav className="navbar">
        <div className="navbar-links">
          <a href="/">Logout</a>
        </div>
      </nav>
      <div className="dashboard-container-dean">
        <header className="dashboard-header-dean">
          <h1>Welcome, {fullName || 'Dean'}!</h1>
        </header>
        <div className="dashboard-content-dean">
          <div className="dashboard-cards-dean">
            {deanSections.map((section, index) => (
              <div
                key={index}
                className="dashboard-card-clickable-dean"
                onClick={() => navigate(section.link)}
              >
                <div className="card-icon-dean">{section.icon}</div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            ))}
          </div>
          <NotificationPanel />
        </div>
      </div>
    </div>
  );
}

export default DeanLanding;
