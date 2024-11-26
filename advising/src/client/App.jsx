import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './global/Login';
import Dashboard from './Dashboard';
import PrerequisiteWaiver from './PrerequisiteWaiver';
import StudentInfo from './StudentInfo';
import AdvisorDashboard from './advisorDashboard';
import AdvisorLanding from './advisorlanding';
import DepartmentChairLanding from './departmentChairLanding';
import DeptChairDashboard from './deptChairDashboard';

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
      {/* Common Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Student Routes */}
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

      {/* Advisor Routes */}
      <Route
        path="/advisor-landing"
        element={<ProtectedRoute element={<AdvisorLanding />} roleRequired="advisor" />}
      />
      <Route
        path="/advisor-dashboard"
        element={<ProtectedRoute element={<AdvisorDashboard />} roleRequired="advisor" />}
      />

      {/* Department Chair Routes */}
      <Route
        path="/department-chair-landing"
        element={<ProtectedRoute element={<DepartmentChairLanding />} roleRequired="dept_chair" />}
      />

       <Route
        path="/department-dashboard"
        element={<ProtectedRoute element={<DeptChairDashboard />} roleRequired="dept_chair" />}
      />
    </Routes>
  );
}

export default App;
