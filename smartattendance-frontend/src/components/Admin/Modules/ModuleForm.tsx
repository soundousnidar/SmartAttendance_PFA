import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Module, ModuleCreate } from '../../../types/module';
import { Filiere } from '../../../types/filiere';
import { filiereAPI } from '../../../services/filiereAPI';
import '../Filieres/Filieres.css';

interface ModuleFormProps {
  module?: Module;
  onSubmit: (data: ModuleCreate) => Promise<void>;
  onCancel: () => void;
  preselectedFiliereId?: number;
  preselectedAnnee?: number;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ 
  module, 
  onSubmit, 
  onCancel,
  preselectedFiliereId,
  preselectedAnnee
}) => {
  const [formData, setFormData] = useState<ModuleCreate>({
    code: '',
    nom: '',
    filiere_id: preselectedFiliereId || 0,
    annee: preselectedAnnee || 1,
  });
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFilieres();
  }, []);

  useEffect(() => {
    if (module) {
      setFormData({
        code: module.code,
        nom: module.nom,
        filiere_id: module.filiere_id,
        annee: module.annee,
      });
    } else {
      if (preselectedFiliereId) {
        setFormData(prev => ({ ...prev, filiere_id: preselectedFiliereId }));
      }
      if (preselectedAnnee) {
        setFormData(prev => ({ ...prev, annee: preselectedAnnee }));
      }
    }
  }, [module, preselectedFiliereId, preselectedAnnee]);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
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

  const filiereOptions = filieres.map(f => ({
    value: f.id,
    label: `${f.code} - ${f.nom}`
  }));

  const anneeOptions = [
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
      '&:hover': { borderColor: '#00A651' },
      minHeight: '48px',
      borderRadius: '6px',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#00A651' : state.isFocused ? '#f0fdf4' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      '&:hover': { backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4' },
    }),
  };

  return (
    <form onSubmit={handleSubmit} className="filiere-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Filière *</label>
        <Select
          options={filiereOptions}
          value={selectedFiliere}
          onChange={(opt) => setFormData({ ...formData, filiere_id: opt?.value || 0 })}
          styles={customStyles}
          placeholder="Sélectionner une filière"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={loading || !!preselectedFiliereId}
        />
      </div>

      <div className="form-group">
        <label>Année *</label>
        <Select
          options={anneeOptions}
          value={selectedAnnee}
          onChange={(opt) => setFormData({ ...formData, annee: opt?.value || 1 })}
          styles={customStyles}
          placeholder="Sélectionner une année"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={loading || !!preselectedAnnee}
        />
      </div>

      <div className="form-group">
        <label htmlFor="code">Code *</label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="Ex: BLOC, BIG, CLOUD"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          disabled={loading}
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nom">Nom *</label>
        <input
          id="nom"
          name="nom"
          type="text"
          placeholder="Ex: Blockchain, Big Data"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn-primary-create" disabled={loading}>
          {loading ? 'Enregistrement...' : module ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default ModuleForm;