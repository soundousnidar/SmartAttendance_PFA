import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { filiereAPI } from '../../../services/filiereAPI';
import { Filiere, FiliereCreate } from '../../../types/filiere';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import AlertModal from '../Shared/AlertModal';  // ← Ajoutez cet import
import FiliereForm from './FiliereForm';
import './Filieres.css';
import '../Shared/Shared.css';

const FilieresList: React.FC = () => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | undefined>();
  const [filiereToDelete, setFiliereToDelete] = useState<Filiere | undefined>();
  
  // ← Ajoutez ces états pour l'AlertModal
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'warning'
  });

  useEffect(() => {
    loadFilieres();
  }, []);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: FiliereCreate) => {
    await filiereAPI.create(data);
    setIsModalOpen(false);
    loadFilieres();
  };

  const handleUpdate = async (data: FiliereCreate) => {
    if (selectedFiliere) {
      await filiereAPI.update(selectedFiliere.id, data);
      setIsModalOpen(false);
      setSelectedFiliere(undefined);
      loadFilieres();
    }
  };

  const openDeleteModal = (filiere: Filiere) => {
    setFiliereToDelete(filiere);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (filiereToDelete) {
      try {
        await filiereAPI.delete(filiereToDelete.id);
        setIsDeleteModalOpen(false);
        setFiliereToDelete(undefined);
        
        // ← Afficher l'alerte de succès
        setAlertConfig({
          title: 'Suppression réussie',
          message: 'La filière a été supprimée avec succès.',
          type: 'success'
        });
        setIsAlertOpen(true);
        
        loadFilieres();
      } catch (error: any) {
        setIsDeleteModalOpen(false);
        setFiliereToDelete(undefined);
        
        // ← Afficher l'alerte d'erreur
        const errorMessage = error.response?.data?.detail || 'Erreur lors de la suppression';
        setAlertConfig({
          title: 'Suppression impossible',
          message: errorMessage,
          type: 'error'
        });
        setIsAlertOpen(true);
      }
    }
  };

  const openCreateModal = () => {
    setSelectedFiliere(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (filiere: Filiere) => {
    setSelectedFiliere(filiere);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="filieres-page">
      <div className="page-header">
        <h1 className="page-title">Filières</h1>
        <button onClick={openCreateModal} className="btn-primary-fileire">
          <Plus size={20} />
          Nouvelle filière
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filieres.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <p>Aucune filière enregistrée</p>
                  </div>
                </td>
              </tr>
            ) : (
              filieres.map((filiere) => (
                <tr key={filiere.id}>
                  <td><strong>{filiere.code}</strong></td>
                  <td>{filiere.nom}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => openEditModal(filiere)}
                        className="btn-icon btn-edit"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(filiere)}
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

      {/* Modal Création/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFiliere(undefined);
        }}
        title={selectedFiliere ? 'Modifier la filière' : 'Nouvelle filière'}
      >
        <FiliereForm
          filiere={selectedFiliere}
          onSubmit={selectedFiliere ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedFiliere(undefined);
          }}
        />
      </Modal>

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setFiliereToDelete(undefined);
        }}
        title="Supprimer la filière"
        message={`Êtes-vous sûr de vouloir supprimer la filière "${filiereToDelete?.code}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      {/* ← Ajoutez l'AlertModal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default FilieresList;