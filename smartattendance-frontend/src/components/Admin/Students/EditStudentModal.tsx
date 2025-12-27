import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { X, Upload } from 'lucide-react';
import { Student } from '../../../types/student';
import { Filiere } from '../../../types/filiere';
import { Groupe } from '../../../types/groupe';
import { filiereAPI } from '../../../services/filiereAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { studentAPI } from '../../../services/studentAPI';
import './Students.css';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

interface SelectOption {
  value: number;
  label: string;
}

const animatedComponents = makeAnimated();

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
  showToast
}) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [filteredGroupes, setFilteredGroupes] = useState<Groupe[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(0);
  const [selectedGroupeId, setSelectedGroupeId] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, student]);

  const loadData = async () => {
    try {
      const [filieresData, groupesData] = await Promise.all([
        filiereAPI.getAll(),
        groupeAPI.getAll()
      ]);
      
      setFilieres(filieresData);
      setGroupes(groupesData);

      // Trouver le groupe actuel de l'étudiant
      if (student.groupe_id) {
        const currentGroupe = groupesData.find(g => g.id === student.groupe_id);
        if (currentGroupe) {
          setSelectedFiliereId(currentGroupe.filiere_id);
          setSelectedGroupeId(currentGroupe.id);
          
          // Filtrer les groupes de cette filière
          const filtered = groupesData.filter(g => g.filiere_id === currentGroupe.filiere_id);
          setFilteredGroupes(filtered);
        }
      }

      // Preview de la photo actuelle
      if (student.photo_path) {
        setPreviewUrl(`http://127.0.0.1:8000/${student.photo_path}`);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleFiliereChange = (option: SelectOption | null) => {
    const filiereId = option?.value || 0;
    setSelectedFiliereId(filiereId);
    setSelectedGroupeId(0); // Reset groupe

    if (filiereId > 0) {
      const filtered = groupes.filter(g => g.filiere_id === filiereId);
      setFilteredGroupes(filtered);
    } else {
      setFilteredGroupes([]);
    }
  };

  const handleGroupeChange = (option: SelectOption | null) => {
    setSelectedGroupeId(option?.value || 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGroupeId === 0) {
      showToast('Veuillez sélectionner un groupe', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Mettre à jour le groupe si changé
      if (selectedGroupeId !== student.groupe_id) {
        await studentAPI.assignGroupe(student.id, selectedGroupeId);
      }

      // 2. Uploader la nouvelle photo si sélectionnée
      if (selectedFile) {
        await studentAPI.uploadPhoto(student.id, selectedFile);
      }

      showToast('Étudiant mis à jour avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || 'Erreur lors de la mise à jour',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filiereOptions: SelectOption[] = filieres.map(f => ({
    value: f.id,
    label: `${f.code} - ${f.nom}`
  }));

  const groupeOptions: SelectOption[] = filteredGroupes.map(g => ({
    value: g.id,
    label: `${g.code} (${g.annee}ère année)`
  }));

  const selectedFiliereOption = filiereOptions.find(opt => opt.value === selectedFiliereId) || null;
  const selectedGroupeOption = groupeOptions.find(opt => opt.value === selectedGroupeId) || null;

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
      cursor: 'pointer',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#00A651'
        : state.isFocused
        ? '#f0fdf4'
        : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
    }),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-student-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier l'étudiant</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="edit-student-form">
            {/* Info étudiant */}
            <div className="student-info-section">
              <h3>{student.full_name}</h3>
              <p className="student-email">{student.email}</p>
            </div>

            {/* Photo */}
            <div className="form-group">
              <label>Photo de l'étudiant</label>
              <div className="photo-upload-section">
                {previewUrl && (
                  <div className="photo-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
                <div className="upload-btn-wrapper">
                  <label className="btn-upload">
                    <Upload size={18} />
                    {selectedFile ? 'Changer la photo' : 'Uploader une nouvelle photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Filière */}
            <div className="form-group">
              <label>Filière *</label>
              <Select<SelectOption>
                options={filiereOptions}
                value={selectedFiliereOption}
                onChange={handleFiliereChange}
                styles={customStyles}
                placeholder="Sélectionner une filière"
                components={animatedComponents}
                isDisabled={loading}
                className="react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {/* Groupe */}
            <div className="form-group">
              <label>Groupe *</label>
              <Select<SelectOption>
                options={groupeOptions}
                value={selectedGroupeOption}
                onChange={handleGroupeChange}
                styles={customStyles}
                placeholder={selectedFiliereId ? "Sélectionner un groupe" : "Sélectionnez d'abord une filière"}
                components={animatedComponents}
                isDisabled={loading || selectedFiliereId === 0}
                className="react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-create"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;