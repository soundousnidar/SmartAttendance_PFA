import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { clearAuthData, getAuthData } from '../../utils/authStorage';
import logoEMSI from '../../assets/images/logo-emsi.png';
import './Layout.css';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user } = getAuthData();

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'admin': 'Administrateur',
      'enseignant': 'Enseignant',
      'student': 'Étudiant',
    };
    return labels[role] || role;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-left">
        <button 
          className="sidebar-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <img src={logoEMSI} alt="EMSI Logo" className="navbar-logo" />
      </div>
      
      <div className="navbar-right">
        {user && (
          <div className="navbar-user">
            <div className="user-avatar">
              {getInitials(user.full_name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user.full_name}</span>
              <span className="user-role">{getRoleLabel(user.role)}</span>
            </div>
          </div>
        )}
        
        <button onClick={handleLogout} className="btn-logout">
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

export default Navbar;