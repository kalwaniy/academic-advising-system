/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Modal from 'react-modal'; 
import Login from './global/Login';
import Dashboard from './Dashboard';
import PrerequisiteWaiver from './PrerequisiteWaiver';
import StudentInfo from './StudentInfo';
import AdvisorDashboard from './advisorDashboard';
import AdvisorLanding from './advisorlanding';
import DepartmentChairLanding from './departmentChairLanding';
import Reports from './reports';
import DeptChairDashboard from './deptChairDashboard';
import FacultyLanding from './facultyLanding';
import FacultyDashboard from './facultyDashboard';
import DeptChairLog from './deptchairlog';
import CoordinatorDashboard from './coordinatordash';

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
      <Route
        path="/reports"
        element={<ProtectedRoute element={<Reports />} roleRequired="advisor" />} // New Reports Route
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

      <Route
        path="/department-logs"
        element={<ProtectedRoute element={<DeptChairLog />} roleRequired="dept_chair" />}
      />

     <Route
        path="/faculty-landing"
        element={<ProtectedRoute element={<FacultyLanding />} roleRequired="faculty" />}
      />

      <Route
        path="/faculty-dashboard"
        element={<ProtectedRoute element={<FacultyDashboard />} roleRequired="faculty" />}
      />

      {/* Department Chair Routes */}
      <Route
        path="/coordinator-dashboard"
        element={<ProtectedRoute element={<CoordinatorDashboard />} roleRequired="coordinator" />}
      />

    </Routes>

    
  );
}

export default App;
