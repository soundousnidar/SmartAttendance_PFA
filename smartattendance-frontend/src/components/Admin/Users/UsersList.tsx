import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Edit2 } from 'lucide-react';
import { User } from '../../../types/auth';
import api from '../../../services/api';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import Select from 'react-select';
import './Users.css';
import '../Shared/Shared.css';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement users:', error);
    } finally {
      setLoading(false);
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
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/auth/users/${selectedUser.id}/role`, {
        is_active: !selectedUser.is_active,
      });
      setIsToggleModalOpen(false);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erreur');
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Étudiant' },
    { value: 'enseignant', label: 'Enseignant' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
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

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">Gestion des Utilisateurs</h1>
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Aucun utilisateur</div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role === 'super_admin' && 'Super Admin'}
                      {user.role === 'admin' && 'Admin'}
                      {user.role === 'enseignant' && 'Enseignant'}
                      {user.role === 'student' && 'Étudiant'}
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

      {/* Modal Modifier Rôle */}
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
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <div className="form-actions">
            <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
              Annuler
            </button>
            <button onClick={handleUpdateRole} className="btn-primary">
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Toggle Active */}
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