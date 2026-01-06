import React from 'react';
import { NavLink } from 'react-router-dom';
import { getAuthData } from '../../utils/authStorage';
import './Layout.css';

import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  User, 
  Video, 
  CheckCircle,
  Backpack,
  UserCheck,
  Bell,              // ← pour Notifications
  ClipboardList,     // ← pour Rapports / Prise de présence
  UserCog  // ← AJOUTER POUR ENSEIGNANTS
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  roles: string[];
}

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = getAuthData();

  const menuItems: MenuItem[] = [
    // ADMIN & SUPER_ADMIN
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/filieres',
      icon: GraduationCap,
      label: 'Filières',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/groupes',
      icon: Users,
      label: 'Groupes',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/students',
      icon: Backpack,
      label: 'Étudiants',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/enseignants',  // ← AJOUTER
      icon: UserCheck,
      label: 'Enseignants',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/modules',
      icon: BookOpen,
      label: 'Modules',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/cours',
      icon: Calendar,
      label: 'Emploi du temps',
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/admin/users',
      icon: User,
      label: 'Utilisateurs',
      roles: ['super_admin'],
    },
    // ENSEIGNANT
{
      path: '/teacher/dashboard',
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/cours',
      icon: Calendar,
      label: 'Mes cours',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/emploi',
      icon: Calendar,
      label: 'Emploi du temps',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/etudiants',
      icon: UserCog,
      label: 'Étudiants',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/seances',
      icon: Video,
      label: 'Séances',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/presence',
      icon: ClipboardList,
      label: 'Prise de présence',
      roles: ['enseignant'],
    },
    {
      path: '/teacher/notification',
      icon: Bell,
      label: 'Notifications',
      roles: ['enseignant'],
    },
    // STUDENT
    {
      path: '/student/dashboard',
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      roles: ['student'],
    },
    {
      path: '/student/schedule',
      icon: Calendar,
      label: 'Mon emploi du temps',
      roles: ['student'],
    },
    {
      path: '/student/attendance',
      icon: CheckCircle,
      label: 'Mes présences',
      roles: ['student'],
    },

    {
      path: '/admin/auto-attendance',
      icon: Video,
      label: 'Surveillance Auto',
      roles: ['admin', 'super_admin'],
    },
  ];

  const filteredItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  const groupedItems: { [key: string]: MenuItem[] } = {
    'Administration': filteredItems.filter(
      item => ['admin', 'super_admin'].some(r => item.roles.includes(r))
    ),
    'Enseignement': filteredItems.filter(
      item => item.roles.includes('enseignant')
    ),
    'Étudiant': filteredItems.filter(
      item => item.roles.includes('student')
    ),
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-menu">
        {Object.entries(groupedItems).map(([section, items]) => 
          items.length > 0 && (
            <div key={section} className="menu-section">
              <div className="menu-section-title">{section}</div>
              {items.map(item => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `menu-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="menu-item-icon">
                      <IconComponent size={20} />
                    </span>
                    <span className="menu-item-text">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )
        )}
      </div>
    </aside>
  );
};

export default Sidebar;