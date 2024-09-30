import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './global/Login';
import Dashboard from './Dashboard'; // Import the Dashboard component
import PrerequisiteWaiver from './PrerequisiteWaiver'; // Import the PrerequisiteWaiver component

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} /> {/* Default route */}
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} /> 
      <Route path="/PrerequisiteWaiver" element={<PrerequisiteWaiver />} /> {/* Corrected route */}
    </Routes>
  );
}

export default App;
