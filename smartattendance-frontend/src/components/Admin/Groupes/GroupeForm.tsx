import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { Groupe, GroupeCreate } from '../../../types/groupe';
import { Filiere } from '../../../types/filiere';
import { filiereAPI } from '../../../services/filiereAPI';
import '../Filieres/Filieres.css';

interface GroupeFormProps {
  groupe?: Groupe;
  onSubmit: (data: GroupeCreate) => Promise<void>;
  onCancel: () => void;
  preselectedFiliereId?: number;
}

interface SelectOption {
  value: number;
  label: string;
}

const animatedComponents = makeAnimated();

const GroupeForm: React.FC<GroupeFormProps> = ({ 
  groupe, 
  onSubmit, 
  onCancel,
  preselectedFiliereId 
}) => {
  const [formData, setFormData] = useState<GroupeCreate>({
    code: '',
    filiere_id: preselectedFiliereId || 0,
    annee: 1,
  });
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFilieres();
  }, []);

  useEffect(() => {
    if (groupe) {
      // Extraire le code court du nom complet (ex: "4IIR-G1" -> "G1")
      const shortCode = groupe.code.includes('-') 
        ? groupe.code.split('-')[1] 
        : groupe.code;
      
      setFormData({
        code: shortCode,
        filiere_id: groupe.filiere_id,
        annee: groupe.annee,
      });
    } else if (preselectedFiliereId) {
      setFormData(prev => ({ ...prev, filiere_id: preselectedFiliereId }));
    }
  }, [groupe, preselectedFiliereId]);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'annee' || e.target.name === 'filiere_id'
      ? parseInt(e.target.value)
      : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.filiere_id === 0) {
      setError('Veuillez sélectionner une filière');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  // Générer le preview du nom complet
  const getPreviewName = () => {
    if (formData.filiere_id === 0 || !formData.code) return '';
    const selectedFiliere = filieres.find(f => f.id === formData.filiere_id);
    if (!selectedFiliere) return '';
    return `${formData.annee}${selectedFiliere.code}-${formData.code}`;
  };

  const previewName = getPreviewName();

  // Prepare options for react-select
  const filiereOptions: SelectOption[] = filieres.map(f => ({
    value: f.id,
    label: `${f.code} - ${f.nom}`
  }));

  const anneeOptions: SelectOption[] = [
    { value: 1, label: '1ère année' },
    { value: 2, label: '2ème année' },
    { value: 3, label: '3ème année' },
    { value: 4, label: '4ème année' },
    { value: 5, label: '5ème année' },
  ];

  const selectedFiliere = filiereOptions.find(opt => opt.value === formData.filiere_id) || null;
  const selectedAnnee = anneeOptions.find(opt => opt.value === formData.annee) || anneeOptions[0];

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

  const handleFiliereChange = (newValue: unknown) => {
    const selectedOption = newValue as SelectOption | null;
    setFormData({
      ...formData,
      filiere_id: selectedOption?.value || 0,
    });
  };

  const handleAnneeChange = (newValue: unknown) => {
    const selectedOption = newValue as SelectOption | null;
    setFormData({
      ...formData,
      annee: selectedOption?.value || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="filiere-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="filiere_id">Filière *</label>
        <Select<SelectOption>
          options={filiereOptions}
          value={selectedFiliere}
          onChange={handleFiliereChange}
          styles={customStyles}
          placeholder="Sélectionner une filière"
          components={animatedComponents}
          isDisabled={loading || !!preselectedFiliereId}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      <div className="form-group">
        <label htmlFor="annee">Année *</label>
        <Select<SelectOption>
          options={anneeOptions}
          value={selectedAnnee}
          onChange={handleAnneeChange}
          styles={customStyles}
          placeholder="Sélectionner une année"
          components={animatedComponents}
          isDisabled={loading}
          className="react-select-container"
          classNamePrefix="react-select"
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>

      <div className="form-group">
        <label htmlFor="code">Code du groupe *</label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="Ex: G1, G2, A, B"
          value={formData.code}
          onChange={handleChange}
          required
          disabled={loading}
          maxLength={10}
        />
        {previewName && (
          <div className="groupe-preview">
            <span className="preview-label">Nom du groupe :</span>
            <span className="preview-name">{previewName}</span>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
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
          {loading ? 'Enregistrement...' : groupe ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default GroupeForm;