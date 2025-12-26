import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/authStorage';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="dashboard-container">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;