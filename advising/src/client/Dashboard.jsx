/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from './NotificationPanel'; // Import the notification panel
import './styles/index.css';

const sections = [
  { title: 'Prerequisite Waiver', icon: '📝', description: 'Click to proceed', link: '/prerequisite-waiver' },
  { title: 'Overloading', icon: '📊', description: '' },
  { title: 'Tasks', icon: '⚠️', description: 'No current tasks' },
];

function Dashboard() {
  const navigate = useNavigate();

  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Student Home</h1>
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
