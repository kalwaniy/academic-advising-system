/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// Define sections for VP Landing Page
const vpSections = [
  { title: 'University Policies', icon: '📜', description: 'Review and approve policies', link: '/vp-policies' },
  { title: 'System Logs', icon: '📊', description: 'Monitor university-wide logs', link: '/vp-logs' },
  { title: 'Reports', icon: '📈', description: 'View university performance reports', link: '/vp-reports' },
];

function VPLanding() {
  const [fullName, setFullName] = useState(''); // Store VP's full name
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVPInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/vp/user-infoo', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

        if (response.data) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          setFullName('Vice President');
        }
      } catch (error) {
        console.error('Error fetching VP info:', error);
        navigate('/login');
      }
    };
    fetchVPInfo();
  }, [navigate]);

  return (
    <div className="advisor-dashboard">
      <nav className="navbar">
        <div className="navbar-links">
          <a href="/">Logout</a>
        </div>
      </nav>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Welcome, {fullName || 'Vice President'}!</h1>
        </header>
        <div className="dashboard-cards">
          {vpSections.map((section, index) => (
            <div key={index} className="dashboard-card clickable" onClick={() => navigate(section.link)}>
              <div className="card-icon">{section.icon}</div>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
          ))}
        </div>
        <NotificationPanel />
      </div>
    </div>
  );
}

export default VPLanding;
