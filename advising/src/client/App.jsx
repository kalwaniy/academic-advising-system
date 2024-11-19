import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './global/Login';
import Dashboard from './Dashboard';
import PrerequisiteWaiver from './PrerequisiteWaiver';
import StudentInfo from './StudentInfo';
import AdvisorDashboard from './advisorDashboard';
import AdvisorLanding from './advisorlanding';

// ProtectedRoute component to enforce role-based access control
function ProtectedRoute({ element: Component, roleRequired }) {
  const token = localStorage.getItem('token');
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;

  if (!decodedToken || decodedToken.role !== roleRequired) {
    return <Navigate to="/login" />;
  }

  return Component;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={<Dashboard />} roleRequired="student" />}
      />
      <Route
        path="/Prerequisite-Waiver"
        element={<ProtectedRoute element={<PrerequisiteWaiver />} roleRequired="student" />}
      />
      <Route
        path="/StudentInfo"
        element={<ProtectedRoute element={<StudentInfo />} roleRequired="student" />}
      />
      <Route
        path="/advisor-landing"
        element={<ProtectedRoute element={<AdvisorLanding />} roleRequired="advisor" />}
      />
      <Route
        path="/advisor-dashboard"
        element={<ProtectedRoute element={<AdvisorDashboard />} roleRequired="advisor" />}
      />
    </Routes>
  );
}

export default App;
