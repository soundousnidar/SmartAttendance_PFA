import React, { useState } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { enseignantAPI } from '../../../services/enseignantAPI';
import { Enseignant } from '../../../types/enseignant';
import ConfirmModal from '../Shared/ConfirmModal';

interface ActiveEnseignantsProps {
  enseignants: Enseignant[];
  onUpdate: () => void;
}

const ActiveEnseignants: React.FC<ActiveEnseignantsProps> = ({ enseignants, onUpdate }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enseignantToDelete, setEnseignantToDelete] = useState<Enseignant | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const confirmDelete = async () => {
    if (enseignantToDelete) {
      try {
        await enseignantAPI.delete(enseignantToDelete.id);
        setIsDeleteModalOpen(false);
        setEnseignantToDelete(null);
        setToast({ show: true, message: 'Enseignant supprimé avec succès', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        onUpdate();
      } catch (error: any) {
        setToast({ show: true, message: error.response?.data?.detail || 'Erreur', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
      }
    }
  };

  return (
    <>
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Photo</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enseignants.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">Aucun enseignant activé</div>
                </td>
              </tr>
            ) : (
              enseignants.map((enseignant) => (
                <tr key={enseignant.id}>
                  <td><strong>{enseignant.full_name}</strong></td>
                  <td>{enseignant.email}</td>
                  <td>
                    {enseignant.photo_path ? (
                      <div className="photo-status">
                        <span className="badge-success">✓ Enregistrée</span>
                        <a
                          href={`http://127.0.0.1:8000/${enseignant.photo_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon btn-view"
                          title="Voir la photo"
                        >
                          <Eye size={16} />
                        </a>
                      </div>
                    ) : (
                      <span className="badge-warning">Non disponible</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setEnseignantToDelete(enseignant);
                          setIsDeleteModalOpen(true);
                        }}
                        className="btn-icon btn-delete"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setEnseignantToDelete(null);
        }}
        title="Supprimer l'enseignant"
        message={`Êtes-vous sûr de vouloir supprimer ${enseignantToDelete?.full_name} ? Cette action supprimera également son compte utilisateur.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </>
  );
};

export default ActiveEnseignants;