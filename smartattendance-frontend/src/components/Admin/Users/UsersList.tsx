import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Edit2 } from 'lucide-react';
import { User } from '../../../types/auth';
import api from '../../../services/api';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import Select from 'react-select';
import './Users.css';
import '../Shared/Shared.css';

interface SelectOption {
  value: string;
  label: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  
  // ← AJOUTER TOAST
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [selectedRole, users]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Erreur chargement users:', error);
      if (error.response?.status === 401) {
        setToast({ show: true, message: 'Session expirée. Veuillez vous reconnecter.', type: 'error' });
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (selectedRole === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === selectedRole));
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsEditModalOpen(true);
  };

  const openToggleModal = (user: User) => {
    setSelectedUser(user);
    setIsToggleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/auth/users/${selectedUser.id}/role`, {
        role: newRole,
      });
      setIsEditModalOpen(false);
      
      // ← TOAST SUCCÈS
      setToast({ show: true, message: `Rôle modifié avec succès`, type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      
      loadUsers();
    } catch (error: any) {
      setIsEditModalOpen(false);
      
      // ← TOAST ERREUR
      const errorMsg = error.response?.data?.detail || 'Erreur lors de la modification';
      setToast({ show: true, message: errorMsg, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/auth/users/${selectedUser.id}/role`, {
        is_active: !selectedUser.is_active,
      });
      setIsToggleModalOpen(false);
      
      // ← TOAST SUCCÈS
      const action = selectedUser.is_active ? 'désactivé' : 'activé';
      setToast({ show: true, message: `Compte ${action} avec succès`, type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      
      loadUsers();
    } catch (error: any) {
      setIsToggleModalOpen(false);
      
      // ← TOAST ERREUR
      const errorMsg = error.response?.data?.detail || 'Erreur lors de la modification';
      setToast({ show: true, message: errorMsg, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Étudiant' },
    { value: 'enseignant', label: 'Enseignant' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  const filterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'enseignant', label: 'Enseignant' },
    { value: 'student', label: 'Étudiant' },
  ];

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'role-badge super-admin';
      case 'admin':
        return 'role-badge admin';
      case 'enseignant':
        return 'role-badge enseignant';
      case 'student':
        return 'role-badge student';
      default:
        return 'role-badge';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'enseignant':
        return 'Enseignant';
      case 'student':
        return 'Étudiant';
      default:
        return role;
    }
  };

  const selectedFilterOption = filterOptions.find(opt => opt.value === selectedRole) || filterOptions[0];

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#00A651' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#00A651',
      },
      minHeight: '48px',
      borderRadius: '6px',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#00A651'
        : state.isFocused
        ? '#f0fdf4'
        : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      '&:hover': {
        backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4',
      },
    }),
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="users-page">
      {/* ← TOAST */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Gestion des Utilisateurs</h1>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Filtrer par rôle :</label>
          <Select
            options={filterOptions}
            value={selectedFilterOption}
            onChange={(option) => setSelectedRole(option?.value || 'all')}
            styles={customStyles}
            placeholder="Sélectionner un rôle..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    {selectedRole === 'all' 
                      ? 'Aucun utilisateur' 
                      : `Aucun utilisateur avec le rôle ${getRoleLabel(selectedRole)}`}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="status-badge active">Actif</span>
                    ) : (
                      <span className="status-badge inactive">Inactif</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn-icon btn-edit"
                        title="Modifier rôle"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openToggleModal(user)}
                        className={`btn-icon ${user.is_active ? 'btn-delete' : 'btn-success'}`}
                        title={user.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le rôle"
      >
        <div className="user-edit-form">
          <p>
            <strong>Utilisateur:</strong> {selectedUser?.full_name}
          </p>
          <div className="form-group">
            <label>Nouveau rôle:</label>
            <Select
              options={roleOptions}
              value={roleOptions.find((opt) => opt.value === newRole)}
              onChange={(opt) => setNewRole(opt?.value || '')}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? '#00A651' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
                  '&:hover': {
                    borderColor: '#00A651',
                  },
                  minHeight: '48px',
                  borderRadius: '6px',
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected
                    ? '#00A651'
                    : state.isFocused
                    ? '#f0fdf4'
                    : 'white',
                  color: state.isSelected ? 'white' : '#1e293b',
                  '&:hover': {
                    backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4',
                  },
                }),
              }}
            />
          </div>
          <div className="form-actions">
            <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
              Annuler
            </button>
            <button onClick={handleUpdateRole} className="btn-primary-users">
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isToggleModalOpen}
        onConfirm={handleToggleActive}
        onCancel={() => setIsToggleModalOpen(false)}
        title={selectedUser?.is_active ? 'Désactiver le compte' : 'Activer le compte'}
        message={`Voulez-vous ${selectedUser?.is_active ? 'désactiver' : 'activer'} le compte de ${
          selectedUser?.full_name
        } ?`}
        confirmText={selectedUser?.is_active ? 'Désactiver' : 'Activer'}
        cancelText="Annuler"
      />
    </div>
  );
};

export default UsersList;