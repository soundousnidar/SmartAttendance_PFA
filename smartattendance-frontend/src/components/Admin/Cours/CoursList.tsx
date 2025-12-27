import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { coursAPI } from '../../../services/coursAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { Cours, CoursCreate } from '../../../types/cours';
import { Groupe } from '../../../types/groupe';
import { Filiere } from '../../../types/filiere';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import CoursForm from './CoursForm';
import './Cours.css';
import '../Shared/Shared.css';

const CoursList: React.FC = () => {
  const [cours, setCours] = useState<Cours[]>([]);
  const [allGroupes, setAllGroupes] = useState<Groupe[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  
  // ← ÉTATS DES FILTRES
  const [selectedAnnee, setSelectedAnnee] = useState<number>(0);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(0);
  const [selectedGroupeId, setSelectedGroupeId] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCours, setSelectedCours] = useState<Cours | undefined>();
  const [coursToDelete, setCoursToDelete] = useState<Cours | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursData, groupesData, filieresData] = await Promise.all([
        coursAPI.getAll(),
        groupeAPI.getAll(),
        filiereAPI.getAll()
      ]);
      setCours(coursData);
      setAllGroupes(groupesData);
      setFilieres(filieresData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCours = async () => {
    try {
      const data = await coursAPI.getAll();
      setCours(data);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    }
  };

  const handleCreate = async (data: CoursCreate) => {
    await coursAPI.create(data);
    setIsModalOpen(false);
    loadCours();
  };

  const handleUpdate = async (data: CoursCreate) => {
    if (selectedCours) {
      await coursAPI.update(selectedCours.id, data);
      setIsModalOpen(false);
      setSelectedCours(undefined);
      loadCours();
    }
  };

  const openDeleteModal = (c: Cours) => {
    setCoursToDelete(c);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (coursToDelete) {
      try {
        await coursAPI.delete(coursToDelete.id);
        setIsDeleteModalOpen(false);
        setCoursToDelete(undefined);
        loadCours();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const openCreateModal = () => {
    setSelectedCours(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cours) => {
    setSelectedCours(c);
    setIsModalOpen(true);
  };

  // ← FILIÈRES FILTRÉES PAR ANNÉE
  const filteredFilieres = selectedAnnee > 0
    ? filieres.filter(f => {
        // Vérifier si cette filière a des groupes pour cette année
        return allGroupes.some(g => g.filiere_id === f.id && g.annee === selectedAnnee);
      })
    : filieres;

  // ← GROUPES FILTRÉS PAR ANNÉE ET FILIÈRE
  const filteredGroupes = allGroupes.filter(g => {
    if (selectedAnnee > 0 && g.annee !== selectedAnnee) return false;
    if (selectedFiliereId > 0 && g.filiere_id !== selectedFiliereId) return false;
    return true;
  });

  // ← COURS FILTRÉS PAR GROUPE
  const filteredCours = selectedGroupeId > 0 
    ? cours.filter(c => c.groupe.id === selectedGroupeId)
    : cours;

  // ← RÉINITIALISER LES FILTRES EN CASCADE
  const handleAnneeChange = (annee: number) => {
    setSelectedAnnee(annee);
    // Si la filière sélectionnée n'existe plus dans les filières filtrées, réinitialiser
    if (selectedFiliereId > 0) {
      const stillExists = allGroupes.some(g => 
        g.filiere_id === selectedFiliereId && (annee === 0 || g.annee === annee)
      );
      if (!stillExists) {
        setSelectedFiliereId(0);
        setSelectedGroupeId(0);
      }
    }
  };

  const handleFiliereChange = (filiereId: number) => {
    setSelectedFiliereId(filiereId);
    // Si le groupe sélectionné n'appartient plus à cette filière, réinitialiser
    if (selectedGroupeId > 0) {
      const groupe = allGroupes.find(g => g.id === selectedGroupeId);
      if (groupe && groupe.filiere_id !== filiereId) {
        setSelectedGroupeId(0);
      }
    }
  };

  // Grouper par jour
  const coursByDay = filteredCours.reduce((acc, c) => {
    if (!acc[c.jour]) acc[c.jour] = [];
    acc[c.jour].push(c);
    return acc;
  }, {} as Record<string, Cours[]>);

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // ← OPTIONS POUR LES DROPDOWNS
  const anneeOptions = [
    { value: 0, label: 'Toutes les années' },
    { value: 1, label: '1ère année' },
    { value: 2, label: '2ème année' },
    { value: 3, label: '3ème année' },
    { value: 4, label: '4ème année' },
    { value: 5, label: '5ème année' },
  ];

  const filiereOptions = [
    { value: 0, label: 'Toutes les filières' },
    ...filteredFilieres.map(f => ({ value: f.id, label: `${f.code} - ${f.nom}` }))
  ];

  const groupeOptions = [
    { value: 0, label: 'Tous les groupes' },
    ...filteredGroupes.map(g => ({ value: g.id, label: g.code }))
  ];

  const selectedAnneeOption = anneeOptions.find(opt => opt.value === selectedAnnee) || anneeOptions[0];
  const selectedFiliereOption = filiereOptions.find(opt => opt.value === selectedFiliereId) || filiereOptions[0];
  const selectedGroupeOption = groupeOptions.find(opt => opt.value === selectedGroupeId) || groupeOptions[0];

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

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="cours-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Emploi du Temps</h1>
        <button onClick={openCreateModal} className="btn-primary-cours">
          <Plus size={20} />
          Nouveau cours
        </button>
      </div>

      {/* ← FILTRES CHAÎNÉS: ANNÉE → FILIÈRE → GROUPE */}
      <div className="filter-section-cours">
        <div className="filter-group-cours">
          <label>Année :</label>
          <Select
            options={anneeOptions}
            value={selectedAnneeOption}
            onChange={(option) => handleAnneeChange(option?.value || 0)}
            styles={customStyles}
            className="react-select-container-cours"
            classNamePrefix="react-select"
          />
        </div>

        <div className="filter-group-cours">
          <label>Filière :</label>
          <Select
            options={filiereOptions}
            value={selectedFiliereOption}
            onChange={(option) => handleFiliereChange(option?.value || 0)}
            styles={customStyles}
            className="react-select-container-cours"
            classNamePrefix="react-select"
          />
        </div>

        <div className="filter-group-cours">
          <label>Groupe :</label>
          <Select
            options={groupeOptions}
            value={selectedGroupeOption}
            onChange={(option) => setSelectedGroupeId(option?.value || 0)}
            styles={customStyles}
            className="react-select-container-cours"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="timetable">
        {/* Time column */}
        <div className="time-column">
          {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((h) => (
            <div key={h} className="time-slot">{h}</div>
          ))}
        </div>

        {/* Days columns */}
        {jours.map((jour) => (
          <div key={jour} className="day-column">
            <div className="day-header">{jour}</div>

            {coursByDay[jour]?.length > 0 ? (
              coursByDay[jour].map((c) => (
                <div
                  key={c.id}
                  className="course-block"
                  style={{
                    top: `${(parseInt(c.heure_debut.split(':')[0]) - 8) * 80}px`,
                    height: `${
                      (parseInt(c.heure_fin.split(':')[0]) -
                        parseInt(c.heure_debut.split(':')[0])) * 80
                    }px`,
                  }}
                >
                  <div className="course-title">{c.module.nom}</div>
                  <div className="course-meta">
                    <span>{c.groupe.code}</span>
                    <span>{c.enseignant.full_name}</span>
                  </div>
                  {c.salle && <div className="course-room">{c.salle}</div>}

                  <div className="course-actions">
                    <button onClick={() => openEditModal(c)}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openDeleteModal(c)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-course-column">—</div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCours(undefined);
        }}
        title={selectedCours ? 'Modifier le cours' : 'Nouveau cours'}
      >
        <CoursForm
          cours={selectedCours}
          onSubmit={selectedCours ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedCours(undefined);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCoursToDelete(undefined);
        }}
        title="Supprimer le cours"
        message={`Supprimer le cours ${coursToDelete?.module.nom} ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default CoursList;