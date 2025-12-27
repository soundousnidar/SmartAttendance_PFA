import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Pencil } from 'lucide-react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { studentAPI } from '../../../services/studentAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { Student } from '../../../types/student';
import { Filiere } from '../../../types/filiere';
import { Groupe } from '../../../types/groupe';
import ConfirmModal from '../Shared/ConfirmModal';
import EditStudentModal from './EditStudentModal';
import './Students.css';

interface ActiveStudentsProps {
  students: Student[];
  onUpdate: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

interface SelectOption {
  value: number | string;
  label: string;
}

const animatedComponents = makeAnimated();

const ActiveStudents: React.FC<ActiveStudentsProps> = ({ students, onUpdate, showToast }) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  
  // Filtres
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(0);
  const [selectedGroupeId, setSelectedGroupeId] = useState<number>(0);
  const [selectedAnnee, setSelectedAnnee] = useState<number>(0);
  const [filteredGroupes, setFilteredGroupes] = useState<Groupe[]>([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  useEffect(() => {
    loadFilieres();
    loadGroupes();
  }, []);

  useEffect(() => {
    setFilteredStudents(students);
  }, [students]);

  useEffect(() => {
    applyFilters();
  }, [selectedFiliereId, selectedGroupeId, selectedAnnee, students, groupes]);

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
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Filtre par filière
    if (selectedFiliereId > 0) {
      const groupesOfFiliere = groupes.filter(g => g.filiere_id === selectedFiliereId);
      const groupeIds = groupesOfFiliere.map(g => g.id);
      filtered = filtered.filter(s => s.groupe_id && groupeIds.includes(s.groupe_id));
    }

    // Filtre par groupe
    if (selectedGroupeId > 0) {
      filtered = filtered.filter(s => s.groupe_id === selectedGroupeId);
    }

    // Filtre par année
    if (selectedAnnee > 0) {
      const groupesOfAnnee = groupes.filter(g => g.annee === selectedAnnee);
      const groupeIds = groupesOfAnnee.map(g => g.id);
      filtered = filtered.filter(s => s.groupe_id && groupeIds.includes(s.groupe_id));
    }

    setFilteredStudents(filtered);
  };

  const handleFiliereChange = (newValue: unknown) => {
    const option = newValue as SelectOption | null;
    const filiereId = Number(option?.value) || 0;
    setSelectedFiliereId(filiereId);
    setSelectedGroupeId(0); // Reset groupe

    if (filiereId > 0) {
      const filtered = groupes.filter(g => g.filiere_id === filiereId);
      setFilteredGroupes(filtered);
    } else {
      setFilteredGroupes(groupes);
    }
  };

  const handleGroupeChange = (newValue: unknown) => {
    const option = newValue as SelectOption | null;
    setSelectedGroupeId(Number(option?.value) || 0);
  };

  const handleAnneeChange = (newValue: unknown) => {
    const option = newValue as SelectOption | null;
    setSelectedAnnee(Number(option?.value) || 0);
  };

  const resetFilters = () => {
    setSelectedFiliereId(0);
    setSelectedGroupeId(0);
    setSelectedAnnee(0);
    setFilteredGroupes(groupes);
  };

  const getGroupeInfo = (groupeId: number | null) => {
    if (!groupeId) return { code: 'Non assigné', filiere: '-' };
    
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return { code: 'Non assigné', filiere: '-' };

    const filiere = filieres.find(f => f.id === groupe.filiere_id);
    
    return {
      code: groupe.code,
      filiere: filiere?.code || '-'
    };
  };

  const handleToast = (message: string, type: 'success' | 'error') => {
    if (showToast) {
      showToast(message, type);
    } else {
      setToast({ show: true, message, type });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await studentAPI.delete(studentToDelete.id);
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        handleToast('Étudiant supprimé avec succès', 'success');
        onUpdate();
      } catch (error: any) {
        handleToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleEditSuccess = () => {
    onUpdate();
  };

  // Options pour les selects
  const filiereOptions: SelectOption[] = [
    { value: 0, label: 'Toutes les filières' },
    ...filieres.map(f => ({ value: f.id, label: `${f.code} - ${f.nom}` }))
  ];

  const groupeOptions: SelectOption[] = [
    { value: 0, label: 'Tous les groupes' },
    ...(selectedFiliereId > 0 ? filteredGroupes : groupes).map(g => ({
      value: g.id,
      label: `${g.code} (${g.annee}ère année)`
    }))
  ];

  const anneeOptions: SelectOption[] = [
    { value: 0, label: 'Toutes les années' },
    { value: 1, label: '1ère année' },
    { value: 2, label: '2ème année' },
    { value: 3, label: '3ème année' },
    { value: 4, label: '4ème année' },
    { value: 5, label: '5ème année' },
  ];

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#00A651' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#00A651',
      },
      minHeight: '42px',
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

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Filtres */}
      <div className="filter-section-students">
        <div className="filters-row">
          <div className="filter-item">
            <label>Filière :</label>
            <Select
              options={filiereOptions}
              value={filiereOptions.find(opt => opt.value === selectedFiliereId)}
              onChange={handleFiliereChange}
              styles={customStyles}
              placeholder="Sélectionner..."
              components={animatedComponents}
              className="react-select-container-small"
              classNamePrefix="react-select"
            />
          </div>

          <div className="filter-item">
            <label>Groupe :</label>
            <Select
              options={groupeOptions}
              value={groupeOptions.find(opt => opt.value === selectedGroupeId)}
              onChange={handleGroupeChange}
              styles={customStyles}
              placeholder="Sélectionner..."
              components={animatedComponents}
              className="react-select-container-small"
              classNamePrefix="react-select"
            />
          </div>

          <div className="filter-item">
            <label>Année :</label>
            <Select
              options={anneeOptions}
              value={anneeOptions.find(opt => opt.value === selectedAnnee)}
              onChange={handleAnneeChange}
              styles={customStyles}
              placeholder="Sélectionner..."
              components={animatedComponents}
              className="react-select-container-small"
              classNamePrefix="react-select"
            />
          </div>

          <button onClick={resetFilters} className="btn-reset-filters">
            Réinitialiser
          </button>
        </div>

        <div className="filter-summary">
          <span className="results-count">
            {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} trouvé{filteredStudents.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Filière</th>
              <th>Groupe</th>
              <th>Photo</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p>
                      {students.length === 0 
                        ? 'Aucun étudiant activé'
                        : 'Aucun étudiant ne correspond aux filtres'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const groupeInfo = getGroupeInfo(student.groupe_id);
                return (
                  <tr key={student.id}>
                    <td><strong>{student.full_name}</strong></td>
                    <td>{student.email}</td>
                    <td>
                      <span className="filiere-badge">{groupeInfo.filiere}</span>
                    </td>
                    <td>
                      <span className="groupe-badge">{groupeInfo.code}</span>
                    </td>
                    <td>
                      {student.photo_path ? (
                        <div className="photo-status">
                          <span className="badge-success">✓ Enregistrée</span>
                          {student.photo_path && (
                            <a
                              href={`http://127.0.0.1:8000/${student.photo_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon btn-view"
                              title="Voir la photo"
                            >
                              <Eye size={16} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="badge-warning">Non disponible</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setStudentToEdit(student);
                            setIsEditModalOpen(true);
                          }}
                          className="btn-icon btn-edit"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(student);
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {studentToEdit && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setStudentToEdit(null);
          }}
          student={studentToEdit}
          onSuccess={handleEditSuccess}
          showToast={handleToast}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        title="Supprimer l'étudiant"
        message={`Êtes-vous sûr de vouloir supprimer ${studentToDelete?.full_name} ? Cette action supprimera également son compte utilisateur.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </>
  );
};

export default ActiveStudents;