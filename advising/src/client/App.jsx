/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import PrerequisiteWaiver from './PrerequisiteWaiver'; // New empty page component
import LoginPage from './LoginPage'; // Assuming you have a login page
import './styles/index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prerequisite-waiver" element={<PrerequisiteWaiver />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;
