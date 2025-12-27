import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Select from 'react-select';
import { groupeAPI } from '../../../services/groupeAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { Groupe, GroupeCreate } from '../../../types/groupe';
import { Filiere } from '../../../types/filiere';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import AlertModal from '../Shared/AlertModal';
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
  const [selectedAnnee, setSelectedAnnee] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | undefined>();
  const [groupeToDelete, setGroupeToDelete] = useState<Groupe | undefined>();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'warning'
  });

  useEffect(() => {
    loadFilieres();
    loadGroupes();
  }, []);

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

  const handleCreate = async (data: GroupeCreate) => {
    await groupeAPI.create(data);
    setIsModalOpen(false);
    loadGroupes();
  };

  const handleUpdate = async (data: GroupeCreate) => {
    if (selectedGroupe) {
      await groupeAPI.update(selectedGroupe.id, data);
      setIsModalOpen(false);
      setSelectedGroupe(undefined);
      loadGroupes();
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
        setAlertConfig({
          title: 'Suppression réussie',
          message: 'Le groupe a été supprimé avec succès.',
          type: 'success'
        });
        setIsAlertOpen(true);
        loadGroupes();
      } catch (error: any) {
        setIsDeleteModalOpen(false);
        setGroupeToDelete(undefined);
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

  // ← FILTRAGE AVANCÉ
  const filteredGroupes = groupes.filter(groupe => {
    if (selectedFiliereId > 0 && groupe.filiere_id !== selectedFiliereId) return false;
    if (selectedAnnee > 0 && groupe.annee !== selectedAnnee) return false;
    if (searchTerm && !groupe.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filiereOptions: SelectOption[] = [
    { value: 0, label: 'Toutes les filières' },
    ...filieres.map(f => ({ value: f.id, label: `${f.code} - ${f.nom}` }))
  ];

  const anneeOptions: SelectOption[] = [
    { value: 0, label: 'Toutes les années' },
    { value: 1, label: '1ère année' },
    { value: 2, label: '2ème année' },
    { value: 3, label: '3ème année' },
    { value: 4, label: '4ème année' },
    { value: 5, label: '5ème année' },
  ];

  const selectedFiliereOption = filiereOptions.find(opt => opt.value === selectedFiliereId) || filiereOptions[0];
  const selectedAnneeOption = anneeOptions.find(opt => opt.value === selectedAnnee) || anneeOptions[0];

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#00A651' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
      '&:hover': { borderColor: '#00A651' },
      minHeight: '48px',
      borderRadius: '6px',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#00A651' : state.isFocused ? '#f0fdf4' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      '&:hover': { backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4' },
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

      {/* ← FILTRES AVANCÉS */}
      <div className="filter-section-groupes">
        <div className="filter-group">
          <label>Filière :</label>
          <Select
            options={filiereOptions}
            value={selectedFiliereOption}
            onChange={(option) => setSelectedFiliereId(option?.value || 0)}
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="filter-group">
          <label>Année :</label>
          <Select
            options={anneeOptions}
            value={selectedAnneeOption}
            onChange={(option) => setSelectedAnnee(option?.value || 0)}
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="filter-group">
          <label>Recherche :</label>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
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
            {filteredGroupes.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <p>Aucun groupe trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGroupes.map((groupe) => {
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
                        <button onClick={() => openEditModal(groupe)} className="btn-icon btn-edit" title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(groupe)} className="btn-icon btn-delete" title="Supprimer">
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
        onClose={() => { setIsModalOpen(false); setSelectedGroupe(undefined); }}
        title={selectedGroupe ? 'Modifier le groupe' : 'Nouveau groupe'}
      >
        <GroupeForm
          groupe={selectedGroupe}
          onSubmit={selectedGroupe ? handleUpdate : handleCreate}
          onCancel={() => { setIsModalOpen(false); setSelectedGroupe(undefined); }}
          preselectedFiliereId={selectedFiliereId > 0 ? selectedFiliereId : undefined}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setIsDeleteModalOpen(false); setGroupeToDelete(undefined); }}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer le groupe "${groupeToDelete?.code}" ?`}
      />

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

export default GroupesList;