/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import './styles/index.css';

const sections = [
  { title: 'Prerequisite Waiver', icon: '📝', description: 'Click to proceed', link: '/Prerequisite-waiver' },
  { title: 'Course Overload', icon: '📚', description: 'Request extra credits', link: '/course-overload' },
  { title: 'Tasks', icon: '⚠', description: 'No current tasks' },
];

// FAQ Component
function FAQSection() {
  return (
    <div className="faq-section">
      <h2>Frequently Asked Questions</h2>

      {/* Waiver FAQ */}
      <div className="faq-item">
        <h3>Prerequisite Waiver Conditions</h3>
        <ul>
          <li>You must demonstrate equivalent knowledge or experience for the prerequisite course.</li>
          <li>Official transcripts or proof of prior coursework might be required.</li>
          <li>A faculty member or advisor may request a meeting or additional documentation.</li>
          <li>Waivers are typically only granted if your background meets or exceeds the learning outcomes of the prerequisite course.</li>
        </ul>
      </div>

      {/* Overload FAQ */}
      <div className="faq-item">
        <h3>Course Overload Conditions</h3>
        <ul>
          <li>Usually requires a minimum GPA (e.g., 3.0) or advisor’s recommendation to exceed the normal credit limit.</li>
          <li>You may be asked to provide a strong justification or reasoning for taking extra credits (e.g., graduating early).</li>
          <li>Approval from department chair or academic advisor may be required based on your total number of credits requested.</li>
          <li>Credit limits are in place to ensure students can handle the workload successfully.</li>
        </ul>
      </div>

      <p>
        For more details about these processes, please refer to the official Student Handbook or
        contact your academic advisor.
      </p>
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/student-dashboard/user-info', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data?.firstName && response.data?.lastName) {
          const { firstName, lastName } = response.data;
          setFullName(`${firstName} ${lastName}`);
        } else {
          setFullName('Student');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 404) {
          navigate('/login');
        }
      }
    };
    fetchUserInfo();
  }, [navigate]);

  const handleClick = (link) => {
    navigate(link);
  };

  return (
    <div className="dashboard-container1">
      <div className="custom-dashboard-wrapper1">
        <div className="dashboard-top-row1">
          <div className="main-content1">
            <header className="dashboard-header1">
              <h1>Welcome, {fullName || 'Student'}!</h1>
            </header>

            <div className="dashboard-cards1">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`dashboard-card1 ${section.link ? 'clickable' : ''}`}
                  onClick={() => section.link && handleClick(section.link)}
                >
                  <div className="card-icon1">{section.icon}</div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Panel */}
          <NotificationPanel />
        </div>

        {/* FAQ Section */}
        <div className="custom-faq-wrapper">
          <FAQSection />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
