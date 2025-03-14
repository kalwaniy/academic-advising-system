/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal'; // Install via npm install react-modal
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

// This is important for react-modal to work properly
Modal.setAppElement('#root');

// Define the sections on the landing page
const sections = [
  { title: 'Manage Waivers', icon: '📜', description: 'Approve or reject waivers', link: '/advisor-dashboard' },
  { title: 'Manage Overloads', icon: '📜', description: 'Approve or reject overloads', link: '/advisor-overload' },
  { title: 'Import Student Data', icon: '🎓', description: 'Import student CSV to database', link: '/advisor-csv' },
  { title: 'Tasks', icon: '📋', description: 'Check pending tasks', link: '/advisor-tasks' },
  { title: 'Create Reports', icon: '📊', description: 'Generate waiver statistics', link: '/reports' },
];

function AdvisorLanding() {
  const [fullName, setFullName] = useState(''); 
  const [modalOpen, setModalOpen] = useState(false);

  // Stats states
  const [waiversPending, setWaiversPending] = useState(0);
  const [waiversInReview, setWaiversInReview] = useState(0);
  const [overloadsPending, setOverloadsPending] = useState(0);
  const [overloadsInReview, setOverloadsInReview] = useState(0);

  const navigate = useNavigate();

  // 1. Fetch advisor info from the server
  useEffect(() => {
    const fetchAdvisorInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/advisor/user-info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          console.warn('Incomplete user data received:', response.data);
          setFullName('Advisor'); // Fallback name
        }
      } catch (error) {
        console.error('Error fetching advisor info:', error);
        if (error.response && error.response.status === 404) {
          navigate('/login'); // Redirect to login if advisor not found
        }
      }
    };

    fetchAdvisorInfo();
  }, [navigate]);

  // 2. Fetch stats (Pending / In Review) for both waivers & overloads
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/advisor/pending-stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = response.data;
        setWaiversPending(data.waiversPending);
        setWaiversInReview(data.waiversInReview);
        setOverloadsPending(data.overloadsPending);
        setOverloadsInReview(data.overloadsInReview);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Handle navigation when a section is clicked
  const handleClick = (link) => {
    navigate(link);
  };

  // Handle report selection
  const handleReportSelection = () => {
    setModalOpen(false);
    navigate('/reports'); 
  };

  return (
    <div className="advisor-dashboard">
      <div className="login-page">
        <nav className="navbar">
          <div className="navbar-brand"></div>
          <div className="navbar-links">
            <a href="/">Logout</a>
          </div>
        </nav>
      </div>

      <div className="dashboard-container">
        <div className="main-content">
          <header className="dashboard-header">
            <h1>Welcome, {fullName || 'Advisor'}!</h1>

            {/* Stats Section */}
            <div className="stats-container">
              <div className="stat-box">
                <h3>Waivers Pending</h3>
                <span>{waiversPending}</span>
              </div>
              <div className="stat-box">
                <h3>Waivers In Review</h3>
                <span>{waiversInReview}</span>
              </div>
              <div className="stat-box">
                <h3>Overloads Pending</h3>
                <span>{overloadsPending}</span>
              </div>
              <div className="stat-box">
                <h3>Overloads In Review</h3>
                <span>{overloadsInReview}</span>
              </div>
            </div>
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

        {/* Modal for Report Selection */}
        <Modal 
          isOpen={modalOpen} 
          onRequestClose={() => setModalOpen(false)}
        >
          <h2>Select Report</h2>
          <ul>
            <li onClick={handleReportSelection}>Prerequisite Waiver Report</li>
          </ul>
          <button onClick={() => setModalOpen(false)}>Close</button>
        </Modal>
      </div>
    </div>
  );
}

export default AdvisorLanding;
