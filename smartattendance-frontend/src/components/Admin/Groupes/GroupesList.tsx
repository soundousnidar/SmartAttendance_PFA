import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { groupeAPI } from '../../../services/groupeAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { Groupe, GroupeCreate } from '../../../types/groupe';
import { Filiere } from '../../../types/filiere';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import GroupeForm from './GroupeForm';
import './Groupes.css';
import '../Shared/Shared.css';

interface SelectOption {
  value: number;
  label: string;
}

const GroupesList: React.FC = () => {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | undefined>();
  const [groupeToDelete, setGroupeToDelete] = useState<Groupe | undefined>();

  useEffect(() => {
    loadFilieres();
    loadGroupes();
  }, []);

  useEffect(() => {
    if (selectedFiliereId > 0) {
      loadGroupesByFiliere(selectedFiliereId);
    } else {
      loadGroupes();
    }
  }, [selectedFiliereId]);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
  };

  const loadGroupes = async () => {
    try {
      const data = await groupeAPI.getAll();
      setGroupes(data);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupesByFiliere = async (filiereId: number) => {
    try {
      setLoading(true);
      const data = await groupeAPI.getByFiliere(filiereId);
      setGroupes(data);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: GroupeCreate) => {
    await groupeAPI.create(data);
    setIsModalOpen(false);
    if (selectedFiliereId > 0) {
      loadGroupesByFiliere(selectedFiliereId);
    } else {
      loadGroupes();
    }
  };

  const handleUpdate = async (data: GroupeCreate) => {
    if (selectedGroupe) {
      await groupeAPI.update(selectedGroupe.id, data);
      setIsModalOpen(false);
      setSelectedGroupe(undefined);
      if (selectedFiliereId > 0) {
        loadGroupesByFiliere(selectedFiliereId);
      } else {
        loadGroupes();
      }
    }
  };

  const openDeleteModal = (groupe: Groupe) => {
    setGroupeToDelete(groupe);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (groupeToDelete) {
      try {
        await groupeAPI.delete(groupeToDelete.id);
        setIsDeleteModalOpen(false);
        setGroupeToDelete(undefined);
        if (selectedFiliereId > 0) {
          loadGroupesByFiliere(selectedFiliereId);
        } else {
          loadGroupes();
        }
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const openCreateModal = () => {
    setSelectedGroupe(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (groupe: Groupe) => {
    setSelectedGroupe(groupe);
    setIsModalOpen(true);
  };

  const getFiliereById = (id: number): Filiere | undefined => {
    return filieres.find(f => f.id === id);
  };

  // Préparer options pour React-Select
  const filiereOptions: SelectOption[] = [
    { value: 0, label: 'Toutes les filières' },
    ...filieres.map(f => ({
      value: f.id,
      label: `${f.code} - ${f.nom}`
    }))
  ];

  const selectedOption = filiereOptions.find(opt => opt.value === selectedFiliereId) || filiereOptions[0];

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

  if (loading && groupes.length === 0) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="groupes-page">
      <div className="page-header">
        <h1 className="page-title">Groupes</h1>
        <button onClick={openCreateModal} className="btn-primary-groupe">
          <Plus size={20} />
          Nouveau groupe
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="filiere-filter">Filtrer par filière :</label>
          <Select
            options={filiereOptions}
            value={selectedOption}
            onChange={(option) => setSelectedFiliereId(option?.value || 0)}
            styles={customStyles}
            placeholder="Sélectionner une filière..."
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Filière</th>
              <th>Code Groupe</th>
              <th>Année</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupes.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <p>
                      {selectedFiliereId > 0
                        ? 'Aucun groupe pour cette filière'
                        : 'Aucun groupe enregistré'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              groupes.map((groupe) => {
                const filiere = getFiliereById(groupe.filiere_id);
                return (
                  <tr key={groupe.id}>
                    <td>
                      <div className="filiere-info">
                        <span className="filiere-code">{filiere?.code}</span>
                        <span>{filiere?.nom}</span>
                      </div>
                    </td>
                    <td><strong>{groupe.code}</strong></td>
                    <td>
                      <span className="annee-badge">{groupe.annee}ère année</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => openEditModal(groupe)}
                          className="btn-icon btn-edit"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(groupe)}
                          className="btn-icon btn-delete"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGroupe(undefined);
        }}
        title={selectedGroupe ? 'Modifier le groupe' : 'Nouveau groupe'}
      >
        <GroupeForm
          groupe={selectedGroupe}
          onSubmit={selectedGroupe ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedGroupe(undefined);
          }}
          preselectedFiliereId={selectedFiliereId > 0 ? selectedFiliereId : undefined}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setGroupeToDelete(undefined);
        }}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer le groupe "${groupeToDelete?.code}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default GroupesList;