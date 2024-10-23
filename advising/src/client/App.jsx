/* eslint-disable no-unused-vars */
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import Login from './global/Login'; // Make sure to import all required components
import Dashboard from './Dashboard';
import PrerequisiteWaiver from './PrerequisiteWaiver';
import StudentInfo from './StudentInfo'; // Import the new StudentInfo component

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/PrerequisiteWaiver" element={<PrerequisiteWaiver />} />
      <Route path="/StudentInfo" element={<StudentInfo />} />
    </Routes>
  );
}

export default App;
