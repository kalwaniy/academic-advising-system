/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// Define sections for VP Landing Page
const vpSections = [
  {
    title: 'overload ',
    icon: '📜',
    description: 'Review and approve overload requests',
    link: '/vp-overload',
  },
];

function VPLanding() {
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVPInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user-infoo', {
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
    <div className="advisor-dashboard-vp">
      <nav className="navbar">
        <div className="navbar-links">
          <a href="/">Logout</a>
        </div>
      </nav>

      <div className="dashboard-container-vp">
        {/* ✅ Welcome message at the top */}
        <header className="dashboard-header-vp">
          <h1>Welcome, {fullName || 'Vice President'}!</h1>
        </header>

        {/* ✅ Flex row wrapper for cards + notif panel */}
        <div className="dashboard-content-vp">
          <div className="dashboard-cards-vp">
            {vpSections.map((section, index) => (
              <div
                key={index}
                className="dashboard-card-clickable-vp"
                onClick={() => navigate(section.link)}
              >
                <div className="card-icon-vp">{section.icon}</div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            ))}
          </div>

          <div className="notification-panel-wrapper-vp">
            <NotificationPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPLanding;
