import React, { useState } from 'react';
import { Upload, Check, Trash2 } from 'lucide-react';
import { enseignantAPI } from '../../../services/enseignantAPI';
import { Enseignant } from '../../../types/enseignant';
import ConfirmModal from '../Shared/ConfirmModal';

interface PendingEnseignantsProps {
  enseignants: Enseignant[];
  onUpdate: () => void;
}

const PendingEnseignants: React.FC<PendingEnseignantsProps> = ({ enseignants, onUpdate }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enseignantToDelete, setEnseignantToDelete] = useState<Enseignant | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const handlePhotoUpload = async (enseignantId: number, file: File) => {
    try {
      await enseignantAPI.uploadPhoto(enseignantId, file);
      setToast({ show: true, message: 'Photo uploadée avec succès', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      onUpdate();
    } catch (error) {
      setToast({ show: true, message: 'Erreur lors de l\'upload', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const handleActivate = async (enseignant: Enseignant) => {
    if (!enseignant.photo_path) {
      setToast({ show: true, message: 'Veuillez d\'abord uploader une photo', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
      return;
    }

    try {
      await enseignantAPI.activate(enseignant.id);
      setToast({ show: true, message: 'Enseignant activé avec succès !', type: 'success' });
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
        onUpdate();
      }, 2000);
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.detail || 'Erreur', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const confirmDelete = async () => {
    if (enseignantToDelete) {
      try {
        await enseignantAPI.delete(enseignantToDelete.id);
        setIsDeleteModalOpen(false);
        setEnseignantToDelete(null);
        setToast({ show: true, message: 'Enseignant supprimé avec succès', type: 'success' });
        setTimeout(() => {
          setToast({ show: false, message: '', type: 'success' });
          onUpdate();
        }, 2000);
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enseignants.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">Aucun enseignant en attente</div>
                </td>
              </tr>
            ) : (
              enseignants.map(enseignant => (
                <tr key={enseignant.id}>
                  <td><strong>{enseignant.full_name}</strong></td>
                  <td>{enseignant.email}</td>
                  <td>
                    {enseignant.photo_path ? (
                      <span className="badge-success">✓ Uploadée</span>
                    ) : (
                      <label className="btn-upload">
                        <Upload size={16} />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) =>
                            e.target.files && handlePhotoUpload(enseignant.id, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => handleActivate(enseignant)}
                        className="btn-icon btn-success"
                        title="Activer"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEnseignantToDelete(enseignant);
                          setIsDeleteModalOpen(true);
                        }}
                        className="btn-icon btn-delete"
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
        onCancel={() => setIsDeleteModalOpen(false)}
        title="Supprimer l'enseignant"
        message={`Supprimer ${enseignantToDelete?.full_name} ?`}
      />
    </>
  );
};

export default PendingEnseignants;