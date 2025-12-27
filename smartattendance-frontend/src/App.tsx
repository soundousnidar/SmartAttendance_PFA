import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import FilieresList from './components/Admin/Filieres/FilieresList';
import GroupesList from './components/Admin/Groupes/GroupesList';
import ModulesList from './components/Admin/Modules/ModulesList';
import StudentsList from './components/Admin/Students/StudentsList';
import CoursList from './components/Admin/Cours/CoursList';
import UsersList from './components/Admin/Users/UsersList';
import AttendancePage from './components/Attendance/AttendancePage';
import EnseignantsList from './components/Admin/Enseignants/EnseignantsList';
import AutoAttendanceMonitor from './components/Attendance/AutoAttendanceMonitor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/attendance"
          element={
            <DashboardLayout>
              <AttendancePage />
            </DashboardLayout>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/filieres"
          element={
            <DashboardLayout>
              <FilieresList />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/groupes"
          element={
            <DashboardLayout>
              <GroupesList />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/modules"
          element={
            <DashboardLayout>
              <ModulesList />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin/students"
          element={
            <DashboardLayout>
              <StudentsList />
            </DashboardLayout>
          }
        />
        <Route
          path="/admin/cours"
          element={
            <DashboardLayout>
              <CoursList />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/users"
          element={
            <DashboardLayout>
              <UsersList />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/enseignants"
          element={
            <DashboardLayout>
              <EnseignantsList />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/auto-attendance"
          element={
            <DashboardLayout>
              <AutoAttendanceMonitor />
            </DashboardLayout>
          }
        />
        
        
        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <DashboardLayout>
              <TeacherDashboard />
            </DashboardLayout>
          }
        />
        
        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <DashboardLayout>
              <StudentDashboard />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;